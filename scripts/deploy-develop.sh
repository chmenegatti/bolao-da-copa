#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.develop.yml"

if [[ -z "${DEV_APP_IMAGE:-}" ]]; then
  echo "DEV_APP_IMAGE precisa estar definido, por exemplo: ghcr.io/owner/repo:develop" >&2
  exit 1
fi

if [[ -z "${DEV_DATABASE_URL:-}" ]]; then
  DEV_DATABASE_URL="file:/data/palpite-dev.db"
fi

if [[ -z "${DEV_NEXTAUTH_URL:-}" ]]; then
  DEV_NEXTAUTH_URL="http://localhost:3000"
elif [[ "${DEV_NEXTAUTH_URL}" != http://* && "${DEV_NEXTAUTH_URL}" != https://* ]]; then
  if [[ "${DEV_NEXTAUTH_URL}" == localhost:* || "${DEV_NEXTAUTH_URL}" == 127.0.0.1:* || "${DEV_NEXTAUTH_URL}" == 0.0.0.0:* ]]; then
    DEV_NEXTAUTH_URL="http://${DEV_NEXTAUTH_URL}"
  else
    DEV_NEXTAUTH_URL="https://${DEV_NEXTAUTH_URL}"
  fi
fi

export DEV_DATABASE_URL
export DEV_NEXTAUTH_URL

cd "$PROJECT_ROOT"

if [[ -z "${DEV_AUTH_SECRET:-}" ]]; then
  echo "DEV_AUTH_SECRET precisa estar definido no ambiente de deploy" >&2
  exit 1
fi

if [[ -z "${DEV_ADMIN_PASS:-}" ]]; then
  echo "DEV_ADMIN_PASS precisa estar definido no ambiente de deploy" >&2
  exit 1
fi

docker compose -f "$COMPOSE_FILE" up -d proxy

docker compose -f "$COMPOSE_FILE" pull app

docker compose -f "$COMPOSE_FILE" run --rm --no-deps --user root --entrypoint sh app -lc "mkdir -p /data && chown -R node:node /data && ./node_modules/.bin/prisma migrate deploy --schema ./prisma/schema.prisma"

docker compose -f "$COMPOSE_FILE" up -d --no-deps app

container_id="$(docker compose -f "$COMPOSE_FILE" ps -q app)"

for _ in $(seq 1 60); do
  health_status="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}starting{{end}}' "$container_id" 2>/dev/null || true)"
  if [[ "$health_status" == "healthy" ]]; then
    break
  fi
  sleep 2
done

health_status="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}starting{{end}}' "$container_id" 2>/dev/null || true)"
if [[ "$health_status" != "healthy" ]]; then
  echo "Novo container da develop não ficou saudável a tempo" >&2
  docker logs "$container_id" || true
  exit 1
fi

docker compose -f "$COMPOSE_FILE" exec -T app sh -lc "npm run -s prisma:seed:admin"

echo "Deploy da branch develop concluído"