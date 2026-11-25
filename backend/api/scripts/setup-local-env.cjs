const { randomBytes } = require('node:crypto');
const { existsSync, readFileSync, writeFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { parseEnv } = require('node:util');

const api = resolve(__dirname, '..');
const admin = resolve(api, '../../frontend/admin');

function createEnv(directory, filename, values) {
  const path = resolve(directory, filename);
  if (existsSync(path)) return;

  const template = readFileSync(resolve(directory, '.env.example'), 'utf8');
  const contents = template.replace(/^([A-Z_]+)=.*$/gm, (line, key) =>
    Object.hasOwn(values, key) ? `${key}=${JSON.stringify(values[key])}` : line,
  );
  writeFileSync(path, contents, { mode: 0o600, flag: 'wx' });
  console.log(`Configuração local criada em ${path}`);
}

createEnv(api, '.env', {
  JWT_SECRET: randomBytes(32).toString('hex'),
  LOCAL_ADMIN_PASSWORD: randomBytes(16).toString('hex'),
});

const apiEnv = parseEnv(readFileSync(resolve(api, '.env'), 'utf8'));
createEnv(admin, '.env.local', {
  NEXTAUTH_SECRET: randomBytes(32).toString('hex'),
  LOCAL_ADMIN_EMAIL: apiEnv.LOCAL_ADMIN_EMAIL ?? '',
  LOCAL_ADMIN_PASSWORD: apiEnv.LOCAL_ADMIN_PASSWORD ?? '',
});
