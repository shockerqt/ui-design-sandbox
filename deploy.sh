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
export PATH="/home/ubuntu/.local/share/fnm/node-versions/v24.16.0/installation/bin:$PATH"
npm ci

echo "🔨 Compilando bundle estático de producción..."
npm run build

# 3. Recargar Nginx para refrescar estáticos
echo "🔄 Recargando Nginx web server..."
sudo systemctl reload nginx

echo "✅ Despliegue estático completado con éxito en https://sandbox.shocker.cl !"
