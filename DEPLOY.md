# Deploy Mental English ke VPS

Panduan memasang website Mental English di VPS dengan Docker. Semua bagian berjalan di satu server:

```
Internet ──► Caddy (port 80/443, HTTPS otomatis Let's Encrypt)
               ├── https://DOMAIN/         ► web  (Next.js)
               └── https://DOMAIN/api/...  ► api  (NestJS) ──► db (PostgreSQL)
```

File yang dipakai: `docker-compose.prod.yml`, `deploy/Caddyfile`, `.env` (dari `.env.production.example`), `backend/Dockerfile`, `frontend/Dockerfile`.

---

## 1. Siapkan VPS & domain

**Spesifikasi minimal:** Ubuntu 22.04 / 24.04, **2 GB RAM**, 2 vCPU, 25 GB disk.
(Dengan 1 GB RAM, proses build bisa gagal kehabisan memori — tambahkan swap, lihat bagian Masalah umum.)

**DNS domain** (di panel tempat beli domain), buat record:

| Tipe | Nama | Nilai |
|---|---|---|
| A | `@` | IP publik VPS |

Tunggu sampai `ping namadomain.id` menunjukkan IP VPS (biasanya beberapa menit, bisa sampai 24 jam).

## 2. Install Docker & firewall

Masuk ke VPS lewat SSH, lalu:

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER    # lalu logout & login lagi

sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 443/udp
sudo ufw enable
```

## 3. Ambil kode

```bash
sudo mkdir -p /opt/mental-english && sudo chown $USER /opt/mental-english
git clone https://github.com/absubandoro/mental-english.git /opt/mental-english
cd /opt/mental-english
```

> Jika repo **private**, GitHub akan meminta login. Gunakan *Personal Access Token* (Settings → Developer settings → Personal access tokens) sebagai password, atau pasang *Deploy key* SSH di repo.

## 4. Isi konfigurasi `.env`

```bash
cp .env.production.example .env
openssl rand -hex 24   # salin hasilnya untuk POSTGRES_PASSWORD
openssl rand -hex 32   # salin hasilnya untuk JWT_SECRET
nano .env
```

| Variabel | Isi |
|---|---|
| `DOMAIN` | domain tanpa `https://`, mis. `mentalenglish.id` |
| `POSTGRES_PASSWORD` | hasil `openssl rand -hex 24` (huruf & angka saja) |
| `JWT_SECRET` | hasil `openssl rand -hex 32` |
| `SEED_PASSWORD` | password untuk akun demo / Super Admin — **jangan** `password123` |

## 5. Jalankan

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Build pertama memakan waktu sekitar 5–10 menit. Cek status:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f caddy   # lihat proses sertifikat HTTPS
```

Struktur database dibuat otomatis lewat **migrasi** setiap kali API start.

## 6. Isi data

**Data demo** (cabang Pusat + 2 cabang contoh, akun pelajar/orang tua/pengajar/admin, blog, mading, pembayaran):

```bash
docker compose -f docker-compose.prod.yml exec api node dist/seed.js
```

Semua akun demo memakai password `SEED_PASSWORD`. Daftar akun ada di README (bagian *Akun demo*).

**Saat siap dipakai sungguhan** — hapus semua data demo, sisakan cabang Pusat (Jatimurni, Bekasi) dan satu Super Admin:

```bash
docker compose -f docker-compose.prod.yml exec api node dist/seed.js --kosong
```

Lalu login sebagai `superadmin@mentalenglish.id` (password = `SEED_PASSWORD`), ganti password lewat **Profil Saya**, dan isi data asli lewat menu admin.

> ⚠️ `--kosong` dan `--reset` menghapus **seluruh** data. Lakukan backup dulu.

Buka `https://DOMAIN` — selesai.

---

## Update ke versi terbaru

```bash
cd /opt/mental-english
./deploy/backup.sh                                   # backup dulu
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Migrasi database baru (jika ada) berjalan otomatis saat API start.

## Backup & restore

Backup database + foto unggahan ke folder `backups/` (backup lebih dari 14 hari dihapus otomatis):

```bash
./deploy/backup.sh
```

Backup otomatis tiap hari jam 02.00 — jalankan `crontab -e` lalu tambahkan:

```
0 2 * * * cd /opt/mental-english && ./deploy/backup.sh >> backups/backup.log 2>&1
```

Sebaiknya salin folder `backups/` ke tempat lain secara berkala (Google Drive, komputer lokal, dll).

**Restore database:**

```bash
zcat backups/db-YYYYMMDD-HHMMSS.sql.gz | docker compose -f docker-compose.prod.yml exec -T db psql -U mental -d mental_english
```

**Restore foto unggahan:**

```bash
docker compose -f docker-compose.prod.yml exec -T api tar -xzf - -C /app < backups/uploads-YYYYMMDD-HHMMSS.tar.gz
```

## Perintah berguna

```bash
docker compose -f docker-compose.prod.yml logs -f api        # log API
docker compose -f docker-compose.prod.yml logs -f web        # log website
docker compose -f docker-compose.prod.yml restart api web    # restart aplikasi
docker compose -f docker-compose.prod.yml down               # matikan (data tetap aman di volume)
docker compose -f docker-compose.prod.yml exec db psql -U mental -d mental_english   # konsol database
```

## Masalah umum

| Gejala | Penyebab & solusi |
|---|---|
| HTTPS gagal / browser "tidak aman" | DNS belum mengarah ke IP VPS, atau port 80/443 tertutup. Cek `ping DOMAIN` dan `sudo ufw status`, lalu `docker compose -f docker-compose.prod.yml restart caddy`. |
| Build berhenti / `Killed` | RAM kurang. Tambah swap 2 GB: `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile && echo '/swapfile none swap sw 0 0' \| sudo tee -a /etc/fstab` |
| `isi DOMAIN di .env` / `isi JWT_SECRET di .env` | File `.env` belum dibuat atau variabelnya kosong (langkah 4). |
| Ganti domain | Ubah `DOMAIN` di `.env`, lalu `docker compose -f docker-compose.prod.yml up -d --build` (website perlu di-build ulang). |
| Login gagal semua akun | Data belum diisi — jalankan langkah 6. |

## Catatan untuk developer: perubahan struktur database

Struktur database dikelola lewat migrasi (`DB_SYNC=false`, juga bawaan `backend/.env.example`). Setelah mengubah entity di `backend/src/entities`, buat migrasi baru di komputer lokal (database lokal harus sudah dimigrasi, bukan hasil `DB_SYNC=true`):

```bash
cd backend
npm run migration:generate src/migrations/NamaPerubahan
```

Commit file migrasinya, lalu deploy seperti biasa — migrasi berjalan otomatis di server.
