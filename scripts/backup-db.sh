#!/usr/bin/env bash
# =============================================================================
# backup-db.sh — Backup automático do banco SQLite do Palpite Perfeito
#
# Uso:  ./scripts/backup-db.sh
# Cron: 0 8,20 * * *  /caminho/para/scripts/backup-db.sh >> /var/log/palpite-backup.log 2>&1
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

DB_PATH="$PROJECT_DIR/prisma/dev.db"
BACKUP_DIR="$PROJECT_DIR/backups"
MAX_BACKUPS=14   # mantém os últimos 14 arquivos (≈1 semana 2×/dia)

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="$BACKUP_DIR/palpite_${TIMESTAMP}.db"

# ----- Criar diretório de backup se não existir -----
mkdir -p "$BACKUP_DIR"

# ----- Verificar se o banco existe -----
if [[ ! -f "$DB_PATH" ]]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERRO: Banco não encontrado em $DB_PATH"
  exit 1
fi

# ----- Realizar o backup usando sqlite3 .backup (safe para banco em uso) -----
if command -v sqlite3 &>/dev/null; then
  sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"
else
  # Fallback: cópia direta (segura apenas se nenhuma escrita estiver em curso)
  cp "$DB_PATH" "$BACKUP_FILE"
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup criado: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# ----- Remover backups antigos além do limite -----
BACKUP_COUNT="$(find "$BACKUP_DIR" -name "palpite_*.db" | wc -l | tr -d ' ')"
if [[ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]]; then
  EXCESS=$(( BACKUP_COUNT - MAX_BACKUPS ))
  # shellcheck disable=SC2012
  find "$BACKUP_DIR" -name "palpite_*.db" | sort | head -n "$EXCESS" | while read -r old_file; do
    rm "$old_file"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Removido backup antigo: $old_file"
  done
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backups mantidos: $(find "$BACKUP_DIR" -name "palpite_*.db" | wc -l | tr -d ' ')/$MAX_BACKUPS"
