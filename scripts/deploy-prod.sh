#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Deploy K8s iniciado"

NAMESPACE="palpite-prod"

if [[ -z "${APP_IMAGE:-}" ]]; then
  echo "APP_IMAGE não definido"
  exit 1
fi

if [[ -z "${ADMIN_PASS:-}" ]]; then
  echo "ADMIN_PASS não definido"
  exit 1
fi

echo "📦 Atualizando aplicação via Helm..."

helm upgrade --install palpite-app k8s/charts/palpite-app \
  -n $NAMESPACE \
  --set image.repository=${APP_IMAGE%:*} \
  --set image.tag=${APP_IMAGE##*:}

echo "⏳ Aguardando rollout..."

kubectl rollout status deployment/palpite-app -n $NAMESPACE --timeout=120s

echo "🔎 Pegando pod..."

POD=$(kubectl get pods -n $NAMESPACE -l app=palpite-app -o jsonpath="{.items[0].metadata.name}")

echo "🗄️ Rodando migrations..."

kubectl exec -n $NAMESPACE $POD -- \
  sh -c "npx prisma migrate deploy"

echo "✅ Migrations aplicadas"

echo "🧠 Rodando seed do admin..."

kubectl exec -n $NAMESPACE $POD -- \
  sh -c "ADMIN_PASS=\"$ADMIN_PASS\" ADMIN_EMAIL=\"$ADMIN_EMAIL\" SEED_MODE=admin-only npx tsx prisma/seed.ts"

echo "✅ Deploy finalizado"