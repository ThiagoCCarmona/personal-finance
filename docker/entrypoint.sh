#!/bin/sh
set -e

echo "==> Aguardando banco de dados e aplicando migrações..."
node dist/db/migrate.js || true

echo "==> Verificando dados iniciais / admin demo seed..."
node dist/db/seeds/initial_seed.js || true

echo "==> Iniciando aplicação..."
exec "$@"
