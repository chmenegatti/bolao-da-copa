#!/usr/bin/env bash
# =============================================================================
# install-cron.sh — Instala o cron de backup automático (2×/dia: 08:00 e 20:00)
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-db.sh"
LOG_FILE="/var/log/palpite-backup.log"
CRON_JOB="0 8,20 * * * $BACKUP_SCRIPT >> $LOG_FILE 2>&1"

# Verificar se o cron já está instalado
if crontab -l 2>/dev/null | grep -qF "$BACKUP_SCRIPT"; then
  echo "✔ Cron já configurado. Nenhuma alteração feita."
  exit 0
fi

# Adicionar ao crontab sem remover entradas existentes
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "✔ Cron instalado com sucesso!"
echo "  Agenda: todos os dias às 08:00 e 20:00"
echo "  Script: $BACKUP_SCRIPT"
echo "  Log:    $LOG_FILE"
echo ""
echo "  Para verificar: crontab -l"
echo "  Para remover:   crontab -e  (apague a linha manualmente)"
