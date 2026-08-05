#!/bin/bash
set -e

echo "🚀 Iniciando despliegue de UI Design Sandbox en VPS..."

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

echo "🔨 Compilando bundle de producción..."
npm run build

# 3. Reiniciar servicio systemd
echo "🔄 Reiniciando servicio systemd ui-design-sandbox.service..."
sudo systemctl restart ui-design-sandbox.service

echo "✅ Despliegue completado con éxito en http://oci2.shocker.cl:8082 !"
