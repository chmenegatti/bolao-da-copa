#!/usr/bin/env bash
# install-service.sh — instala ou atualiza os units systemd do auto-deploy do Bolão da Copa
# Execute: sudo ./scripts/install-service.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

SERVICE_SRC="$PROJECT_ROOT/deploy/systemd/bolao-deploy.service"
TIMER_SRC="$PROJECT_ROOT/deploy/systemd/bolao-deploy.timer"
TARGET_DIR="/etc/systemd/system"

if [[ "$EUID" -ne 0 ]]; then
  echo "Este script precisa ser executado como root (use sudo)."
  exit 1
fi

# Torna o script de deploy executável
chmod +x "$PROJECT_ROOT/scripts/auto-deploy.sh"

echo "→ Copiando units para $TARGET_DIR ..."
cp "$SERVICE_SRC" "$TARGET_DIR/bolao-deploy.service"
cp "$TIMER_SRC"   "$TARGET_DIR/bolao-deploy.timer"

echo "→ Recarregando systemd..."
systemctl daemon-reload

echo "→ Habilitando e iniciando o timer..."
systemctl enable --now bolao-deploy.timer

echo ""
echo "✓ Instalação concluída!"
echo ""
echo "Comandos úteis:"
echo "  sudo systemctl status bolao-deploy.timer     # estado do timer"
echo "  sudo systemctl status bolao-deploy.service   # última execução"
echo "  sudo journalctl -u bolao-auto-deploy -f      # logs em tempo real"
echo "  sudo systemctl list-timers bolao-deploy.timer # próximo disparo"
echo ""
echo "Para rodar um deploy manualmente:"
echo "  sudo systemctl start bolao-deploy.service"
echo ""
echo "Para desinstalar:"
echo "  sudo systemctl disable --now bolao-deploy.timer"
echo "  sudo rm $TARGET_DIR/bolao-deploy.{service,timer}"
echo "  sudo systemctl daemon-reload"
