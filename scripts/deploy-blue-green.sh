#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.prod.yml"
UPSTREAM_FILE="$PROJECT_ROOT/deploy/nginx/upstream.conf"

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

docker compose -f "$COMPOSE_FILE" up -d proxy

current_slot="blue"
if [[ -f "$UPSTREAM_FILE" ]] && grep -q "app-green:3000" "$UPSTREAM_FILE"; then
  current_slot="green"
fi

if [[ "$current_slot" == "blue" ]]; then
  next_slot="green"
else
  next_slot="blue"
fi

echo "Slot atual: $current_slot"
echo "Slot de deploy: $next_slot"

docker compose -f "$COMPOSE_FILE" pull "app-$next_slot"

docker compose -f "$COMPOSE_FILE" run --rm --no-deps --user root --entrypoint sh "app-$next_slot" -lc "mkdir -p /data && chown -R node:node /data && ./node_modules/.bin/prisma migrate deploy --schema ./prisma/schema.prisma"

docker compose -f "$COMPOSE_FILE" up -d --no-deps "app-$next_slot"

container_id="$(docker compose -f "$COMPOSE_FILE" ps -q "app-$next_slot")"

for _ in $(seq 1 60); do
  health_status="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}starting{{end}}' "$container_id" 2>/dev/null || true)"
  if [[ "$health_status" == "healthy" ]]; then
    break
  fi
  sleep 2
done

health_status="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}starting{{end}}' "$container_id" 2>/dev/null || true)"
if [[ "$health_status" != "healthy" ]]; then
  echo "Novo container não ficou saudável a tempo" >&2
  docker logs "$container_id" || true
  exit 1
fi

docker compose -f "$COMPOSE_FILE" exec -T "app-$next_slot" sh -lc "ADMIN_PASS=\"$ADMIN_PASS\" npm run -s prisma:seed:admin"

cat > "$UPSTREAM_FILE" <<EOF
server app-$next_slot:3000;
EOF

docker compose -f "$COMPOSE_FILE" exec -T proxy nginx -s reload

docker compose -f "$COMPOSE_FILE" stop "app-$current_slot" || true

echo "Deploy concluído no slot $next_slot"