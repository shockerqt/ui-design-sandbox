#!/bin/bash
set -e

echo "🚀 Iniciando despliegue de UI Design Sandbox en Nginx VPS..."

CDIR="$(cd "$(dirname "$0")" && pwd)"
cd "$CDIR"

# 1. Obtener última versión
echo "📥 Jalando cambios desde GitHub (main)..."
git fetch origin main
git reset --hard origin/main

# 2. Instalar dependencias y compilar
echo "📦 Instalando dependencias..."
# Resuelve el Node 24 más reciente instalado por fnm; si no hay, usa el del PATH.
FNM_NODE_BIN="$(ls -d /home/ubuntu/.local/share/fnm/node-versions/v24.*/installation/bin 2>/dev/null | sort -V | tail -1)"
if [ -n "$FNM_NODE_BIN" ]; then
  export PATH="$FNM_NODE_BIN:$PATH"
fi
echo "   Node $(node --version) / npm $(npm --version)"
npm ci

echo "🔨 Compilando bundle estático de producción..."
npm run build

# 3. Recargar Nginx para refrescar estáticos
echo "🔄 Recargando Nginx web server..."
sudo systemctl reload nginx

echo "✅ Despliegue estático completado con éxito en https://sandbox.shocker.cl !"
