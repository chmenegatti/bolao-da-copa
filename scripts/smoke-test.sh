#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${1:-${NEXTAUTH_URL:-}}"

if [[ -z "${BASE_URL}" ]]; then
  echo "NEXTAUTH_URL precisa estar definido para o smoke test" >&2
  exit 1
fi

BASE_URL="${BASE_URL%/}"

check_endpoint() {
  local path="$1"
  local expected_body="${2:-}"
  local label="$3"
  local url="${BASE_URL}${path}"

  echo "🔎 Smoke test: ${label}"

  for _ in $(seq 1 30); do
    if response="$(curl -fsS --max-time 10 "${url}" 2>/dev/null)"; then
      if [[ -z "${expected_body}" || "${response}" == *"${expected_body}"* ]]; then
        echo "✅ ${label}"
        return 0
      fi
    fi

    sleep 2
  done

  echo "❌ Smoke test falhou em ${label}: ${url}" >&2
  exit 1
}

check_endpoint "/api/health" "healthy" "API de saúde"
check_endpoint "/auth" "" "Página de autenticação"

echo "✅ Smoke test concluído"