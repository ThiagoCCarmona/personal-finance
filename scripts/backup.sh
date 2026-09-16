#!/bin/sh
set -e

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_financeiro_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "==> [BACKUP] Iniciando dump do banco de dados financeiro..."
pg_dump -h "${DB_HOST:-db}" -U "${POSTGRES_USER:-postgres}" "${POSTGRES_DB:-financeiro}" | gzip > "${BACKUP_FILE}"

echo "==> [BACKUP] Backup gerado com sucesso em: ${BACKUP_FILE}"

echo "==> [BACKUP] Removendo backups com mais de ${RETENTION_DAYS} dias..."
find "${BACKUP_DIR}" -name "backup_financeiro_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete

echo "==> [BACKUP] Processo de backup concluído."
