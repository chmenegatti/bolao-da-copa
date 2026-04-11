#!/usr/bin/env bash

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Uso: $0 <compose_project_name>" >&2
  echo "Exemplo: $0 palpite-perfeito" >&2
  exit 1
fi

PROJECT_NAME="$1"

dead_or_exited_ids="$(docker ps -aq \
  --filter "label=com.docker.compose.project=${PROJECT_NAME}" \
  --filter "status=dead" \
  --filter "status=exited")"

if [[ -z "${dead_or_exited_ids}" ]]; then
  echo "Nenhum container morto/parado para limpar no projeto ${PROJECT_NAME}."
  exit 0
fi

echo "Removendo containers mortos/parados do projeto ${PROJECT_NAME}..."
docker rm -f ${dead_or_exited_ids} >/dev/null
echo "Limpeza concluída."
