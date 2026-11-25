const { execFile, spawn } = require('node:child_process');
const { existsSync, mkdirSync } = require('node:fs');
const { connect } = require('node:net');
const { resolve } = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');
const { promisify } = require('node:util');

const exec = promisify(execFile);
const root = resolve(__dirname, '..');
const host = '127.0.0.1';
const mongoPort = 27017;
const redisPort = 6382;
const firebasePort = 9010;
const firebaseHubPort = 4410;
const timeout = 120_000;

async function mongoReady() {
  await exec('mongosh', [
    '--norc', '--quiet', `mongodb://${host}:${mongoPort}/admin?serverSelectionTimeoutMS=1000`,
    '--eval', 'quit(db.runCommand({ ping: 1 }).ok === 1 ? 0 : 1)',
  ], { timeout: 3_000 });
  return true;
}

async function redisReady() {
  const { stdout } = await exec('redis-cli', ['-h', host, '-p', String(redisPort), 'ping'], { timeout: 1_500 });
  return stdout.trim() === 'PONG';
}

async function firebaseReady() {
  const options = { signal: AbortSignal.timeout(1_500) };
  const hub = await fetch(`http://${host}:${firebaseHubPort}/emulators`, options);
  if (!hub.ok || (await hub.json()).database?.port !== firebasePort) return false;
  const database = await fetch(`http://${host}:${firebasePort}/.json?ns=demo-adaptamidia`, options);
  return database.ok;
}

function portOpen(port) {
  return new Promise((done) => {
    const socket = connect({ host, port, timeout: 500 });
    const finish = (open) => {
      socket.destroy();
      done(open);
    };
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

async function ready(check) {
  try {
    return await check();
  } catch (error) {
    if (error.code === 'ENOENT') throw new Error(`Required command is missing: ${error.path}.`);
    return false;
  }
}

async function waitFor(name, check, signal) {
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    signal?.throwIfAborted();
    if (await ready(check)) return;
    await delay(400, undefined, { signal });
  }
  throw new Error(`Timed out waiting for ${name}.`);
}

function firebaseEnv() {
  const javaHome = ['/opt/homebrew', '/usr/local']
    .map((prefix) => resolve(prefix, 'opt/openjdk@21/libexec/openjdk.jdk/Contents/Home'))
    .find((home) => existsSync(resolve(home, 'bin/java')));
  if (!javaHome) return process.env;
  return { ...process.env, JAVA_HOME: javaHome, PATH: `${javaHome}/bin:${process.env.PATH}` };
}

async function startInfrastructure() {
  const children = [];
  const stop = new AbortController();
  const shutdown = (signal) => {
    if (stop.signal.aborted) return;
    stop.abort();
    for (const { child } of children) {
      if (!child.pid) continue;
      try {
        process.kill(-child.pid, signal);
      } catch (error) {
        if (error.code !== 'ESRCH') console.error(error.message);
      }
    }
  };
  const interrupt = () => shutdown('SIGINT');
  const terminate = () => shutdown('SIGTERM');
  process.on('SIGINT', interrupt);
  process.on('SIGTERM', terminate);

  let reportExit;
  const earlyExit = new Promise((done) => { reportExit = done; });

  function start(name, command, args, options = {}) {
    stop.signal.throwIfAborted();
    const child = spawn(command, args, {
      cwd: root,
      stdio: 'inherit',
      detached: true,
      ...options,
    });
    const closed = new Promise((done) => child.once('close', done));
    child.once('error', (error) => reportExit(new Error(`${name}: ${error.message}`)));
    child.once('exit', (code, signal) => reportExit(new Error(`${name} stopped (${code ?? signal}).`)));
    children.push({ child, closed });
  }

  async function run() {
    for (const port of [redisPort, firebasePort, firebaseHubPort, 4510]) {
      if (await portOpen(port)) throw new Error(`Port ${port} is busy. Stop the previous local stack.`);
    }
    if (await ready(mongoReady)) {
      console.log(`Using the existing MongoDB on ${mongoPort}.`);
    } else {
      if (await portOpen(mongoPort)) throw new Error(`Port ${mongoPort} is busy and MongoDB did not respond.`);
      const dbPath = resolve(root, '.dev-local/mongo');
      mkdirSync(dbPath, { recursive: true });
      start('MongoDB', 'mongod', ['--bind_ip', host, '--port', String(mongoPort), '--dbpath', dbPath]);
    }
    start('Redis', 'redis-server', [
      '--bind', host, '--port', String(redisPort), '--save', '', '--appendonly', 'no',
    ]);
    start('Firebase', 'npx', [
      '--yes', '--package', 'firebase-tools@15.34.1', 'firebase', 'emulators:start',
      '--project', 'demo-adaptamidia', '--config', 'firebase.local.json', '--only', 'database',
    ], { cwd: resolve(root, 'backend/api'), env: firebaseEnv() });

    await Promise.all([
      waitFor('MongoDB', mongoReady, stop.signal),
      waitFor('Redis', redisReady, stop.signal),
      waitFor('the Firebase emulator', firebaseReady, stop.signal),
    ]);
    console.log('Local infrastructure is ready.');
  }

  try {
    await Promise.race([run(), earlyExit.then((error) => { throw error; })]);
    if (!stop.signal.aborted) {
      const error = await earlyExit;
      if (!stop.signal.aborted) throw error;
    }
  } catch (error) {
    if (!stop.signal.aborted) throw error;
  } finally {
    shutdown('SIGTERM');
    await Promise.all(children.map(({ closed }) => closed));
    process.off('SIGINT', interrupt);
    process.off('SIGTERM', terminate);
  }
}

async function main() {
  if (process.argv[2] === 'start') return startInfrastructure();
  if (process.argv[2] !== 'wait') throw new Error('Expected start or wait.');
  await Promise.all([
    waitFor('MongoDB', mongoReady),
    waitFor('Redis', redisReady),
    waitFor('the Firebase emulator', firebaseReady),
  ]);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
