#!/usr/bin/env bash
# auto-deploy.sh — puxa nova imagem do GHCR e faz rollout via docker-compose.local.yml
# Executado pelo bolao-deploy.timer (systemd) a cada minuto.

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.local.yml"
IMAGE="ghcr.io/chmenegatti/bolao-da-copa:latest"
STATE_FILE="/tmp/bolao-last-image-digest"
LOG_TAG="bolao-auto-deploy"

log() { echo "[$(date -Iseconds)] $*" | systemd-cat -t "$LOG_TAG" -p info 2>/dev/null || echo "[$(date -Iseconds)] $*"; }
err() { echo "[$(date -Iseconds)] ERROR: $*" | systemd-cat -t "$LOG_TAG" -p err 2>/dev/null || echo "[$(date -Iseconds)] ERROR: $*" >&2; }

# Verifica se o .env existe para ler variáveis de ambiente
ENV_FILE="$PROJECT_ROOT/.env"
if [[ -f "$ENV_FILE" ]]; then
  set -o allexport
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +o allexport
fi

if [[ -z "${AUTH_SECRET:-}" ]]; then
  err "AUTH_SECRET não definido. Defina no .env ou no ambiente do serviço."
  exit 1
fi

# Busca o digest remoto sem baixar a imagem inteira
log "Verificando nova versão de $IMAGE..."
REMOTE_DIGEST="$(docker manifest inspect "$IMAGE" 2>/dev/null \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('config',{}).get('digest','') or d['manifests'][0]['digest'])" 2>/dev/null || true)"

if [[ -z "$REMOTE_DIGEST" ]]; then
  err "Não foi possível inspecionar o manifest de $IMAGE. Pulando ciclo."
  exit 0
fi

LAST_DIGEST="$(cat "$STATE_FILE" 2>/dev/null || true)"

if [[ "$REMOTE_DIGEST" == "$LAST_DIGEST" ]]; then
  log "Nenhuma atualização. Digest atual: ${REMOTE_DIGEST:0:20}..."
  exit 0
fi

log "Nova imagem detectada! Digest anterior: ${LAST_DIGEST:0:20}... → novo: ${REMOTE_DIGEST:0:20}..."

cd "$PROJECT_ROOT"

log "Baixando nova imagem..."
docker compose -f "$COMPOSE_FILE" pull app

log "Rodando migrações..."
docker compose -f "$COMPOSE_FILE" run --rm --no-deps app sh -c "npx prisma migrate deploy"

log "Reiniciando container com nova imagem..."
docker compose -f "$COMPOSE_FILE" up -d --force-recreate app

log "Aguardando healthcheck..."
CONTAINER_ID="$(docker compose -f "$COMPOSE_FILE" ps -q app 2>/dev/null)"
for _ in $(seq 1 60); do
  STATUS="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}starting{{end}}' "$CONTAINER_ID" 2>/dev/null || echo starting)"
  if [[ "$STATUS" == "healthy" ]]; then
    break
  fi
  sleep 3
done

STATUS="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}starting{{end}}' "$CONTAINER_ID" 2>/dev/null || echo unknown)"
if [[ "$STATUS" != "healthy" ]]; then
  err "Container não ficou saudável após deploy. Logs:"
  docker logs --tail 50 "$CONTAINER_ID" 2>&1 | systemd-cat -t "$LOG_TAG" -p err 2>/dev/null || docker logs --tail 50 "$CONTAINER_ID" >&2
  exit 1
fi

echo "$REMOTE_DIGEST" > "$STATE_FILE"
log "Deploy concluído com sucesso. Container: $CONTAINER_ID"
