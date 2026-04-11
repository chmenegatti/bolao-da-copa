#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.prod.yml"

if [[ -z "${APP_IMAGE:-}" ]]; then
  echo "APP_IMAGE precisa estar definido, por exemplo: ghcr.io/owner/repo:latest" >&2
  exit 1
fi

cd "$PROJECT_ROOT"

if [[ -z "${AUTH_SECRET:-}" ]]; then
  echo "AUTH_SECRET precisa estar definido no ambiente de deploy" >&2
  exit 1
fi

if [[ -z "${ADMIN_PASS:-}" ]]; then
  echo "ADMIN_PASS precisa estar definido no ambiente de deploy" >&2
  exit 1
fi

if [[ -z "${POSTGRES_USER:-}" ]]; then
  echo "POSTGRES_USER precisa estar definido no ambiente de deploy" >&2
  exit 1
fi

if [[ -z "${POSTGRES_PASSWORD:-}" ]]; then
  echo "POSTGRES_PASSWORD precisa estar definido no ambiente de deploy" >&2
  exit 1
fi

if [[ -z "${POSTGRES_DB:-}" ]]; then
  echo "POSTGRES_DB precisa estar definido no ambiente de deploy" >&2
  exit 1
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}?schema=public"
fi

if [[ -z "${NEXTAUTH_URL:-}" ]]; then
  NEXTAUTH_URL="http://localhost:8080"
fi

export DATABASE_URL
export POSTGRES_USER
export POSTGRES_PASSWORD
export POSTGRES_DB
export NEXTAUTH_URL

docker compose -f "$COMPOSE_FILE" up -d db

docker compose -f "$COMPOSE_FILE" pull app
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
  echo "Container de produção não ficou saudável a tempo" >&2
  docker logs "$container_id" || true
  exit 1
fi

docker compose -f "$COMPOSE_FILE" exec -T app sh -lc "ADMIN_PASS=\"$ADMIN_PASS\" npm run -s prisma:seed:admin"

bash "$PROJECT_ROOT/scripts/cleanup-dead-containers.sh" "palpite-perfeito"

echo "Deploy de produção concluído"