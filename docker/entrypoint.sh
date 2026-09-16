#!/bin/sh
set -e

echo "==> Aguardando banco de dados e aplicando migrações..."
node dist/db/migrate.js || true

echo "==> Iniciando aplicação..."
exec "$@"
