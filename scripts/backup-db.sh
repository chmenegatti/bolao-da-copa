#!/usr/bin/env bash
# =============================================================================
# backup-db.sh — Backup automático do banco PostgreSQL do Palpite Perfeito
#
# Uso:  ./scripts/backup-db.sh
# Cron: 0 8,20 * * *  /caminho/para/scripts/backup-db.sh >> /var/log/palpite-backup.log 2>&1
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

BACKUP_DIR="$PROJECT_DIR/backups"
MAX_BACKUPS=14   # mantém os últimos 14 arquivos (≈1 semana 2×/dia)

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="$BACKUP_DIR/palpite_${TIMESTAMP}.sql"

if [[ -z "${DATABASE_URL:-}" ]]; then
  if [[ -n "${POSTGRES_USER:-}" && -n "${POSTGRES_PASSWORD:-}" && -n "${POSTGRES_DB:-}" ]]; then
    DB_HOST="${POSTGRES_HOST:-localhost}"
    DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${DB_HOST}:5432/${POSTGRES_DB}"
  else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERRO: DATABASE_URL ou POSTGRES_USER/POSTGRES_PASSWORD/POSTGRES_DB precisam estar definidos"
    exit 1
  fi
fi

# ----- Criar diretório de backup se não existir -----
mkdir -p "$BACKUP_DIR"

# ----- Realizar o backup usando pg_dump -----
if command -v pg_dump &>/dev/null; then
  pg_dump "$DATABASE_URL" > "$BACKUP_FILE"
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERRO: pg_dump não encontrado no PATH"
  exit 1
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup criado: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# ----- Remover backups antigos além do limite -----
BACKUP_COUNT="$(find "$BACKUP_DIR" -name "palpite_*.sql" | wc -l | tr -d ' ')"
if [[ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]]; then
  EXCESS=$(( BACKUP_COUNT - MAX_BACKUPS ))
  # shellcheck disable=SC2012
  find "$BACKUP_DIR" -name "palpite_*.sql" | sort | head -n "$EXCESS" | while read -r old_file; do
    rm "$old_file"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Removido backup antigo: $old_file"
  done
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backups mantidos: $(find "$BACKUP_DIR" -name "palpite_*.sql" | wc -l | tr -d ' ')/$MAX_BACKUPS"
