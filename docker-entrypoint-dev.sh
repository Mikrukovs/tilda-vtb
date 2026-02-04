#!/bin/sh
set -e

echo "=== Dev Entrypoint: Installing dependencies ==="

# Установим зависимости если node_modules пустой или отсутствует tailwindcss
if [ ! -d "node_modules/tailwindcss" ]; then
  echo "tailwindcss not found, running npm install..."
  npm install
else
  echo "node_modules looks good, skipping npm install"
fi

echo "=== Starting Next.js dev server ==="
exec "$@"
