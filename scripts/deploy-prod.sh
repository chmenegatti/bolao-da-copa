#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Deploy K8s iniciado"

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NAMESPACE="palpite-prod"
CLUSTER_NAME="palpite-prod-db"
CLUSTER_MANIFEST="$PROJECT_ROOT/k8s/postgres-clusters/postgres-prod.yaml"

if [[ -z "${APP_IMAGE:-}" ]]; then
  echo "APP_IMAGE não definido"
  exit 1
fi

if [[ -z "${NEXTAUTH_URL:-}" ]]; then
  echo "NEXTAUTH_URL não definido"
  exit 1
fi

if [[ -z "${ADMIN_PASS:-}" ]]; then
  echo "ADMIN_PASS não definido"
  exit 1
fi

if [[ -z "${AUTH_SECRET:-}" ]]; then
  echo "AUTH_SECRET não definido"
  exit 1
fi

if [[ -z "${POSTGRES_USER:-}" ]]; then
  echo "POSTGRES_USER não definido"
  exit 1
fi

if [[ -z "${POSTGRES_PASSWORD:-}" ]]; then
  echo "POSTGRES_PASSWORD não definido"
  exit 1
fi

if [[ -z "${POSTGRES_DB:-}" ]]; then
  echo "POSTGRES_DB não definido"
  exit 1
fi

ADMIN_EMAIL="${ADMIN_EMAIL:-admin@bolao.com}"
DB_SECRET_NAME="${DB_SECRET_NAME:-pg-auth-prod}"
DB_SERVICE_HOST="${DB_SERVICE_HOST:-${CLUSTER_NAME}-rw}"

APP_HOST="${NEXTAUTH_URL#*://}"
APP_HOST="${APP_HOST%%/*}"
APP_HOST="${APP_HOST%%:*}"

if [[ -z "$APP_HOST" || "$APP_HOST" == "$NEXTAUTH_URL" ]]; then
  echo "NEXTAUTH_URL precisa ser uma URL válida, por exemplo https://bolao.example.com"
  exit 1
fi

kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

echo "📦 Aplicando cluster PostgreSQL..."
kubectl apply -f "$CLUSTER_MANIFEST"

echo "⏳ Aguardando o secret do banco..."
until kubectl get secret "$DB_SECRET_NAME" -n "$NAMESPACE" >/dev/null 2>&1; do
  sleep 2
done

echo "⏳ Aguardando os pods do banco ficarem prontos..."
until kubectl get pods -n "$NAMESPACE" -l "cnpg.io/cluster=$CLUSTER_NAME" -o name | grep -q .; do
  sleep 2
done

kubectl wait -n "$NAMESPACE" --for=condition=Ready pod -l "cnpg.io/cluster=$CLUSTER_NAME" --timeout=10m

echo "📦 Instalando ingress..."
helm upgrade --install palpite-ingress k8s/charts/palpite-ingress \
  -n "$NAMESPACE" \
  --create-namespace \
  --set-string ingress.hosts[0].host="$APP_HOST" \
  --set-string ingress.hosts[0].paths[0].path=/ \
  --set-string ingress.hosts[0].paths[0].pathType=Prefix \
  --set-string ingress.className=traefik

echo "📦 Atualizando aplicação via Helm..."

helm upgrade --install palpite-app k8s/charts/palpite-app \
  -n "$NAMESPACE" \
  --create-namespace \
  --set-string image.repository="${APP_IMAGE%:*}" \
  --set-string image.tag="${APP_IMAGE##*:}" \
  --set-string database.secretName="$DB_SECRET_NAME" \
  --set-string database.host="$DB_SERVICE_HOST" \
  --set-string database.name="$POSTGRES_DB" \
  --set database.port=5432 \
  --set-string env.NEXTAUTH_URL="$NEXTAUTH_URL" \
  --set-string env.ADMIN_EMAIL="$ADMIN_EMAIL" \
  --set-string secrets.AUTH_SECRET="$AUTH_SECRET"

echo "⏳ Aguardando rollout..."

kubectl rollout status deployment/palpite-app -n "$NAMESPACE" --timeout=120s

echo "🔎 Pegando pod..."

POD=$(kubectl get pods -n "$NAMESPACE" -l app=palpite-app -o jsonpath="{.items[0].metadata.name}")

echo "🗄️ Rodando migrations..."

kubectl exec -n "$NAMESPACE" "$POD" -- \
  sh -c "npx prisma migrate deploy"

echo "✅ Migrations aplicadas"

echo "🧠 Rodando seed do admin..."

kubectl exec -n "$NAMESPACE" "$POD" -- \
  sh -c "ADMIN_PASS=\"$ADMIN_PASS\" ADMIN_EMAIL=\"$ADMIN_EMAIL\" SEED_MODE=admin-only npx tsx prisma/seed.ts"

echo "✅ Deploy finalizado"