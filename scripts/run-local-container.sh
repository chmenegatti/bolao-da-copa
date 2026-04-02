#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$PROJECT_ROOT"

if [[ -z "${AUTH_SECRET:-}" ]]; then
  echo "AUTH_SECRET precisa estar definido para rodar o container local" >&2
  exit 1
fi

docker compose -f docker-compose.local.yml up -d --build

echo "Container local iniciado em http://localhost:${LOCAL_PORT:-3000}"