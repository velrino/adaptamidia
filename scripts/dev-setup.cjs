const { spawnSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { parseEnv } = require('node:util');

const root = resolve(__dirname, '..');
const api = resolve(root, 'backend/api');
const vision = resolve(root, 'backend/vision');
const python = resolve(vision, '.venv/bin/python');

function run(command, args) {
  const result = spawnSync(command, args, { cwd: vision, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited with ${result.status ?? result.signal}.`);
}

try {
  require(resolve(api, 'scripts/setup-local-env.cjs'));
  const env = { ...parseEnv(readFileSync(resolve(api, '.env'), 'utf8')), ...process.env };
  const expected = {
    APP_ENV: 'development',
    HOST: '127.0.0.1',
    PORT: '4002',
    MONGO_URI: 'mongodb://127.0.0.1:27017/adaptamidia_local',
    REDIS_HOST: '127.0.0.1',
    REDIS_PORT: '6382',
    FIREBASE_DATABASE_EMULATOR_HOST: '127.0.0.1:9010',
    DETECTION_API_URL: 'http://127.0.0.1:8000',
  };
  for (const [key, value] of Object.entries(expected)) {
    if (env[key] !== value) throw new Error(`Set ${key} to ${value} for local development.`);
  }

  const check = spawnSync(python, ['-c', 'import uvicorn, watchfiles'], { stdio: 'ignore' });
  if (check.status !== 0) {
    run('uv', ['venv', '--python', '3.12', '--allow-existing', '.venv']);
    run('uv', [
      'pip', 'install', '--python', python, '-r', 'requirements-mac.txt',
      'numpy==1.26.4', 'torch==2.5.1', 'torchvision==0.20.1', 'watchfiles',
    ]);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
