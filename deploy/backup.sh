#!/usr/bin/env bash
# Backup database + foto unggahan platform Nofosys ke folder backups/.
# Pemakaian (dari folder project):  ./deploy/backup.sh
# Cron harian jam 02.00:  0 2 * * * cd /var/www/nofosys && ./deploy/backup.sh >> backups/backup.log 2>&1
set -euo pipefail
cd "$(dirname "$0")/.."
STAMP=$(date +%Y%m%d-%H%M%S)
KEEP_DAYS=${KEEP_DAYS:-14}
mkdir -p backups

# Ambil DATABASE_URL dari backend/.env
DATABASE_URL=$(grep -E '^DATABASE_URL=' backend/.env | cut -d= -f2-)
if [ -z "$DATABASE_URL" ]; then echo "DATABASE_URL tidak ditemukan di backend/.env" >&2; exit 1; fi

pg_dump --dbname="$DATABASE_URL" --clean --if-exists --no-owner | gzip > "backups/db-$STAMP.sql.gz"
tar -czf "backups/uploads-$STAMP.tar.gz" -C backend uploads

find backups -name 'db-*.sql.gz' -mtime +"$KEEP_DAYS" -delete
find backups -name 'uploads-*.tar.gz' -mtime +"$KEEP_DAYS" -delete
echo "[$(date)] Backup selesai: backups/db-$STAMP.sql.gz, backups/uploads-$STAMP.tar.gz"
