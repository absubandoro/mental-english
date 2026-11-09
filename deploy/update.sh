#!/usr/bin/env bash
# Update website ke versi terbaru dari GitHub (jalankan dari folder project).
#   ./deploy/update.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Backup sebelum update"
./deploy/backup.sh

echo "==> Ambil kode terbaru"
git pull --ff-only

echo "==> Build API"
(cd backend && npm ci && npm run build)

echo "==> Build website"
(cd frontend && npm ci && npm run build)

echo "==> Muat ulang aplikasi (migrasi database berjalan otomatis)"
pm2 reload ecosystem.config.js --update-env
pm2 save
echo "==> Selesai"
