const { accessSync, constants, readdirSync } = require('node:fs');
const { homedir } = require('node:os');
const { delimiter, dirname, join } = require('node:path');

function findNode24() {
  if (process.versions.node.split('.')[0] === '24') return process.execPath;

  const versionsDir = join(process.env.NVM_DIR || join(homedir(), '.nvm'), 'versions', 'node');
  const versions = (readdirSync(versionsDir, { throwIfNoEntry: false }) ?? [])
    .filter((version) => /^v24\.\d+\.\d+$/.test(version))
    .sort((a, b) => b.localeCompare(a, 'en', { numeric: true }));
  for (const version of versions) {
    const binary = join(versionsDir, version, 'bin', 'node');
    try {
      accessSync(binary, constants.X_OK);
      return binary;
    } catch {
      // Try the next installed version.
    }
  }
  throw new Error('Node.js 24 is required. Run nvm install and nvm use in the repository root.');
}

try {
  const [task, ...args] = process.argv.slice(2);
  if (task !== 'dev' && task !== 'seed') throw new Error('Expected dev or seed.');
  const node = findNode24();
  const npm = node === process.execPath ? process.env.npm_execpath : join(dirname(node), 'npm');
  const command = task === 'dev'
    ? [require.resolve('turbo/bin/turbo'), 'run', 'dev:local', '--env-mode=loose']
    : [npm, 'run', 'seed:display', '--workspace', 'api'];
  const env = { ...process.env, PATH: `${dirname(node)}${delimiter}${process.env.PATH ?? ''}` };
  process.execve(node, [node, ...command, ...args], env);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
