#!/usr/bin/env bash
# Backup database + file unggahan Mental English.
# Pemakaian (dari folder project):  ./deploy/backup.sh
# Cron harian jam 02.00:  0 2 * * * cd /opt/mental-english && ./deploy/backup.sh >> backups/backup.log 2>&1
set -euo pipefail
cd "$(dirname "$0")/.."
COMPOSE="docker compose -f docker-compose.prod.yml"
STAMP=$(date +%Y%m%d-%H%M%S)
KEEP_DAYS=${KEEP_DAYS:-14}
mkdir -p backups

$COMPOSE exec -T db pg_dump -U mental -d mental_english --clean --if-exists | gzip > "backups/db-$STAMP.sql.gz"
$COMPOSE exec -T api tar -czf - -C /app uploads > "backups/uploads-$STAMP.tar.gz"

# Hapus backup lebih lama dari KEEP_DAYS hari
find backups -name 'db-*.sql.gz' -mtime +"$KEEP_DAYS" -delete
find backups -name 'uploads-*.tar.gz' -mtime +"$KEEP_DAYS" -delete
echo "[$(date)] Backup selesai: backups/db-$STAMP.sql.gz, backups/uploads-$STAMP.tar.gz"
