#!/usr/bin/env bash
set -euo pipefail
# Give each service its own process group so Ctrl+C also stops its workers.
set -m

root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../../.." && pwd)
api="$root/backend/api"
admin="$root/frontend/admin"
vision="$root/backend/vision"
state="$root/.dev-local"
log_dir="$state/logs"
pids=()
names=()
log_pid=''

node_bin="${NVM_DIR:-$HOME/.nvm}/versions/node/v24.16.0/bin"
if [[ -x "$node_bin/node" ]]; then
  export PATH="$node_bin:$PATH"
fi

fail() {
  printf 'Erro: %s\n' "$*" >&2
  exit 1
}

cleanup() {
  local index
  for ((index=${#pids[@]} - 1; index >= 0; index--)); do
    kill -TERM -- "-${pids[index]}" 2>/dev/null || true
  done
  for index in "${!pids[@]}"; do
    wait "${pids[index]}" 2>/dev/null || true
  done
  if [[ -n "$log_pid" ]]; then
    kill "$log_pid" 2>/dev/null || true
    wait "$log_pid" 2>/dev/null || true
  fi
}

trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

seed=false
if [[ ${1:-} == --seed && $# == 1 ]]; then
  seed=true
elif (( $# > 0 )); then
  fail 'uso: dev.sh [--seed]'
fi

for command in node npm curl lsof mongosh redis-cli; do
  command -v "$command" >/dev/null || fail "comando indisponível: $command"
done
node -e 'process.exit(process.versions.node.split(".")[0] === "24" ? 0 : 1)' ||
  fail 'selecione Node.js 24 antes de continuar'

[[ -f "$admin/package.json" && -f "$vision/main.py" ]] ||
  fail 'verifique as pastas frontend/admin, backend/api e backend/vision do monorepo'
node "$api/scripts/setup-local-env.cjs"
node --env-file="$api/.env" -e '
  const env = process.env;
  const local = env.APP_ENV === "development" && env.HOST === "127.0.0.1" &&
    env.PORT === "4002" && env.MONGO_URI === "mongodb://127.0.0.1:27017/adaptamidia_local" &&
    env.REDIS_HOST === "127.0.0.1" && env.REDIS_PORT === "6382" &&
    env.FIREBASE_DATABASE_EMULATOR_HOST === "127.0.0.1:9010" &&
    env.DETECTION_API_URL === "http://127.0.0.1:8000";
  if (!local) process.exit(1);
' || fail 'a API precisa apontar para as portas e os bancos locais desta stack'

for port in 6382 9010 4410 4510 4002 4001 8000; do
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    fail "porta $port ocupada. Encerre a instância anterior antes de rodar ./dev.sh."
  fi
done

start_service() {
  local name=$1 dir=$2 port=$3 probe=$4 timeout=$5 pid deadline
  shift 5

  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    fail "porta $port ocupada. A verificação de $name falhou."
  fi

  printf 'Subindo %s em %s…\n' "$name" "$port"
  (cd "$dir" && exec "$@") >>"$log_dir/$name.log" 2>&1 &
  pid=$!
  pids+=("$pid")
  names+=("$name")
  deadline=$((SECONDS + timeout))

  while ! "$probe"; do
    kill -0 "$pid" 2>/dev/null || fail "$name encerrou. Veja $log_dir/$name.log"
    (( SECONDS < deadline )) || fail "$name demorou para iniciar. Veja $log_dir/$name.log"
    sleep 1
  done
  printf '✓ %s pronto\n' "$name"
}

mongo_ready() {
  mongosh --norc --quiet 'mongodb://127.0.0.1:27017/admin?serverSelectionTimeoutMS=1000' \
    --eval 'quit(db.runCommand({ ping: 1 }).ok === 1 ? 0 : 1)' >/dev/null 2>&1
}

redis_ready() {
  [[ $(redis-cli -h 127.0.0.1 -p 6382 ping 2>/dev/null) == PONG ]]
}

firebase_ready() {
  curl -fsS --max-time 3 'http://127.0.0.1:4410/emulators' 2>/dev/null |
    node -e 'try { const info = JSON.parse(require("node:fs").readFileSync(0)); process.exit(info.database?.port === 9010 ? 0 : 1); } catch { process.exit(1); }' &&
    curl -fsS --max-time 3 'http://127.0.0.1:9010/.json?ns=demo-adaptamidia' >/dev/null 2>&1
}

api_ready() {
  curl -fsS --max-time 3 'http://127.0.0.1:4002/' 2>/dev/null |
    node -e 'try { const info = JSON.parse(require("node:fs").readFileSync(0)); process.exit(info.environment === "DEVELOPMENT" && info.result?.length && info.result.every(entry => Object.values(entry).every(check => check.status === "UP")) ? 0 : 1); } catch { process.exit(1); }'
}

admin_ready() {
  curl -fsS --max-time 8 'http://127.0.0.1:4001/api/auth/providers' 2>/dev/null |
    grep -Fq 'http://127.0.0.1:4001/api/auth/callback/credentials'
}

vision_ready() {
  curl -fsS --max-time 3 'http://127.0.0.1:8000/openapi.json' 2>/dev/null |
    node -e 'try { const info = JSON.parse(require("node:fs").readFileSync(0)); process.exit(info.info?.title === "AI Vision Detection API" ? 0 : 1); } catch { process.exit(1); }'
}

mkdir -p "$log_dir"
logs=()
for service in MongoDB Redis Firebase API Admin Vision; do
  log="$log_dir/$service.log"
  : >"$log"
  logs+=("$log")
done
tail -n +1 -F "${logs[@]}" &
log_pid=$!

if mongo_ready; then
  printf '✓ Usando o MongoDB já em execução em 27017\n'
else
  command -v mongod >/dev/null || fail 'instale o MongoDB ou inicie a sua instância local'
  mkdir -p "$state/mongo"
  start_service MongoDB "$root" 27017 mongo_ready 45 mongod --bind_ip 127.0.0.1 --port 27017 --dbpath "$state/mongo"
fi
start_service Redis "$root" 6382 redis_ready 15 redis-server --bind 127.0.0.1 --port 6382 --save '' --appendonly no

java_home=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
if [[ -x "$java_home/bin/java" ]]; then
  export JAVA_HOME="$java_home"
  export PATH="$JAVA_HOME/bin:$PATH"
fi
start_service Firebase "$api" 9010 firebase_ready 120 npx --yes --package firebase-tools@15.34.1 firebase emulators:start \
  --project demo-adaptamidia --config firebase.local.json --only database

if [[ ! -x "$api/node_modules/.bin/nest" ]]; then
  (cd "$api" && npm ci --no-audit --no-fund)
fi
if [[ ! -x "$admin/node_modules/.bin/next" ]]; then
  (cd "$admin" && npm ci --legacy-peer-deps --no-audit --no-fund)
fi
if [[ ! -x "$vision/.venv/bin/python" ]] || ! "$vision/.venv/bin/python" -c 'import uvicorn' 2>/dev/null; then
  command -v uv >/dev/null || fail 'instale uv para preparar o Vision'
  (cd "$vision" && uv venv --python 3.12 --allow-existing .venv &&
    uv pip install --python .venv/bin/python -r requirements-mac.txt \
      'numpy==1.26.4' 'torch==2.5.1' 'torchvision==0.20.1')
fi
if ! "$vision/.venv/bin/python" -c 'import watchfiles' 2>/dev/null; then
  command -v uv >/dev/null || fail 'instale uv para preparar o hot reload do Vision'
  (cd "$vision" && uv pip install --python .venv/bin/python watchfiles)
fi

if [[ "$seed" == true ]]; then
  (cd "$api" && npm run seed:display)
fi

start_service API "$api" 4002 api_ready 120 npm run dev
start_service Admin "$admin" 4001 admin_ready 120 npm run dev -- --hostname 127.0.0.1 --port 4001
start_service Vision "$vision" 8000 vision_ready 240 .venv/bin/python -u -m uvicorn main:app \
  --host 127.0.0.1 --port 8000 --reload --reload-exclude .venv

printf '\nAdmin   http://127.0.0.1:4001/login\nAPI     http://127.0.0.1:4002/\nVision  http://127.0.0.1:8000/docs\n'
printf 'Logs em %s. Ctrl+C encerra a stack iniciada por este script.\n' "$log_dir"
while true; do
  for index in "${!pids[@]}"; do
    kill -0 "${pids[index]}" 2>/dev/null || fail "${names[index]} encerrou. Veja $log_dir/${names[index]}.log"
  done
  sleep 1
done
