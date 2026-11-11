/**
 * Konfigurasi PM2 untuk server production platform Nofosys.
 *   pm2 start ecosystem.config.js     -> jalankan API & website
 *   pm2 reload ecosystem.config.js    -> muat ulang tanpa downtime setelah update
 * Konfigurasi rahasia ada di backend/.env dan frontend/.env.production.local (lihat DEPLOY.md).
 */
const path = require('path');

module.exports = {
  apps: [
    {
      name: 'nofosys-api',
      cwd: path.join(__dirname, 'backend'),
      script: 'dist/main.js',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '500M',
      time: true,
    },
    {
      name: 'nofosys-web',
      cwd: path.join(__dirname, 'frontend'),
      script: 'node_modules/next/dist/bin/next',
      // Hanya mendengarkan di localhost; akses publik lewat Nginx
      args: 'start -H 127.0.0.1 -p 3000',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '700M',
      time: true,
    },
  ],
};
