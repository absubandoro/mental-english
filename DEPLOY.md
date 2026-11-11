# Deploy Mental English ke VPS (PM2 + Nginx)

Panduan memasang website Mental English di VPS **tanpa Docker**. Semua berjalan langsung di server:

```
Internet ──► Nginx (port 80/443, HTTPS gratis dari Let's Encrypt via Certbot)
               ├── https://DOMAIN/         ► PM2: mental-english-web  (Next.js, 127.0.0.1:3000)
               └── https://DOMAIN/api/...  ► PM2: mental-english-api  (NestJS, 127.0.0.1:4000)
                                                     └──► PostgreSQL (lokal)
```

File yang dipakai: `ecosystem.config.js` (PM2), `deploy/nginx.conf`, `backend/.env.production.example`, `frontend/.env.production.example`, `deploy/backup.sh`, `deploy/update.sh`.

Contoh di panduan ini memakai domain **`mentalenglish.id`** dan folder **`/var/www/mental-english`** — ganti sesuai milik Anda.

---

## 1. Siapkan VPS & domain

**Spesifikasi minimal:** Ubuntu 22.04 / 24.04, **2 GB RAM**, 2 vCPU, 25 GB disk.
(Dengan 1 GB RAM, proses build bisa gagal kehabisan memori — tambahkan swap, lihat *Masalah umum*.)

**DNS domain** (di panel tempat beli domain):

| Tipe | Nama | Nilai |
|---|---|---|
| A | `@` | IP publik VPS |

Tunggu sampai `ping mentalenglish.id` menunjukkan IP VPS.

## 2. Install software

Masuk ke VPS lewat SSH, lalu:

```bash
sudo apt update && sudo apt upgrade -y

# Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git

# PostgreSQL, Nginx, Certbot
sudo apt install -y postgresql nginx certbot python3-certbot-nginx

# PM2
sudo npm install -g pm2

# Firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 3. Buat database

```bash
openssl rand -hex 24          # salin hasilnya sebagai password database
sudo -u postgres psql
```

Di dalam konsol `psql` (ganti `PASSWORD_DB` dengan hasil di atas):

```sql
CREATE ROLE mental LOGIN PASSWORD 'PASSWORD_DB';
CREATE DATABASE mental_english OWNER mental;
\q
```

## 4. Ambil kode

```bash
sudo mkdir -p /var/www/mental-english && sudo chown $USER /var/www/mental-english
git clone -b main https://github.com/absubandoro/mental-english.git /var/www/mental-english
cd /var/www/mental-english
```

> Jika repo **private**, GitHub meminta login: gunakan *Personal Access Token* (Settings → Developer settings → Personal access tokens) sebagai password, atau pasang *Deploy key* SSH di repo.

## 5. Isi konfigurasi

**API** — `backend/.env`:

```bash
cp backend/.env.production.example backend/.env
openssl rand -hex 32          # salin hasilnya untuk JWT_SECRET
nano backend/.env
```

| Variabel | Isi |
|---|---|
| `DATABASE_URL` | ganti `GANTI_PASSWORD_DB` dengan password database (langkah 3) |
| `JWT_SECRET` | hasil `openssl rand -hex 32` |
| `CORS_ORIGIN` | `https://*.domain-anda` |
| `PUBLIC_URL` | `/api` |
| `PLATFORM_DOMAIN` | `domain-anda` (subdomain klien: `<slug>.domain-anda`) |
| `DEFAULT_ORG` | `mental-english` (lembaga untuk domain utama) |
| `SEED_PASSWORD` | password untuk akun demo / Super Admin — **jangan** `password123` |

**Website** — `frontend/.env.production.local`:

```bash
cp frontend/.env.production.example frontend/.env.production.local
nano frontend/.env.production.local      # ganti mentalenglish.id dengan domain Anda
```

## 6. Build

```bash
cd /var/www/mental-english/backend  && npm ci && npm run build
cd /var/www/mental-english/frontend && npm ci && npm run build
cd /var/www/mental-english
```

## 7. Isi data

**Data demo** (cabang Pusat + 2 cabang contoh, akun pelajar/orang tua/pengajar/admin, blog, mading, pembayaran):

```bash
cd backend && node dist/seed.js && cd ..
```

Perintah ini juga membuat struktur database (migrasi). Semua akun demo memakai password `SEED_PASSWORD`; daftar akun ada di README (*Akun demo*).

## 8. Jalankan dengan PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup          # jalankan perintah "sudo env PATH=..." yang ditampilkan, agar otomatis jalan saat VPS restart
pm2 install pm2-logrotate   # log tidak memenuhi disk
```

Cek: `pm2 status` → `mental-english-api` dan `mental-english-web` harus **online**.

## 9. Nginx & HTTPS

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/mental-english
sudo nano /etc/nginx/sites-available/mental-english     # ganti mentalenglish.id dengan domain Anda
sudo ln -s /etc/nginx/sites-available/mental-english /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Sertifikat HTTPS gratis (otomatis diperpanjang)
sudo certbot --nginx -d mentalenglish.id
```

Buka `https://mentalenglish.id` — selesai. 🎉

---

## Multi-lembaga: subdomain & domain klien

Satu instalasi melayani banyak lembaga (klien). Lembaga dikenali dari **domain yang dibuka**; semua memakai aplikasi, database, dan server yang sama, dengan data terpisah per lembaga. Mental English adalah lembaga pertama (slug `mental-english`).

### A. Subdomain untuk setiap klien (`<slug>.mentalenglish.id`)

1. **DNS wildcard** (sekali saja), di panel domain:

   | Tipe | Nama | Nilai |
   |---|---|---|
   | A | `*` | IP publik VPS |

2. **Sertifikat HTTPS wildcard** (sekali saja). Let's Encrypt mewajibkan verifikasi DNS untuk wildcard:

   ```bash
   sudo certbot certonly --manual --preferred-challenges dns -d mentalenglish.id -d '*.mentalenglish.id'
   ```
   Certbot meminta Anda menambahkan record `TXT _acme-challenge` di panel domain. Cara manual ini harus diulang tiap ±90 hari; agar perpanjangan otomatis, pakai plugin DNS penyedia domain Anda (mis. `python3-certbot-dns-cloudflare` bila DNS di Cloudflare).
   Lalu di `/etc/nginx/sites-available/mental-english`, tambahkan blok HTTPS (salin isi `location` dari blok port 80):
   ```nginx
   server {
       listen 443 ssl;
       listen [::]:443 ssl;
       server_name mentalenglish.id *.mentalenglish.id;
       ssl_certificate     /etc/letsencrypt/live/mentalenglish.id/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/mentalenglish.id/privkey.pem;
       # ... location /api/ dan location / sama seperti blok port 80 ...
   }
   ```
   dan ubah blok port 80 menjadi pengalih: `return 301 https://$host$request_uri;`.

3. **`backend/.env`**: `PLATFORM_DOMAIN=mentalenglish.id` (dan `DEFAULT_ORG=mental-english` bila domain utama milik Mental English). **`frontend/.env.production.local`**: `NEXT_PUBLIC_API_URL=/api`. Lalu build ulang website dan `pm2 reload ecosystem.config.js --update-env`.

4. **Tambah klien baru:**
   ```bash
   cd /var/www/mental-english/backend
   node dist/org.js tambah --slug kursus-budi --nama "Kursus Budi" --email superadmin@kursusbudi.com --cabang "Kursus Budi Depok" --warna "#16a34a"
   ```
   Hasilnya: alamat `https://kursus-budi.mentalenglish.id`, akun Super Admin, dan password awal. Klien login, mengganti password, lalu mengisi **Identitas Lembaga** (logo, warna, foto, kontak).

### B. Domain milik klien (`belajar.kursusbudi.com`)

1. Klien menambahkan record di panel domain mereka: `CNAME belajar → mentalenglish.id` (atau `A belajar → IP VPS`).
2. Daftarkan domainnya:
   ```bash
   node dist/org.js domain-tambah --slug kursus-budi --domain belajar.kursusbudi.com
   ```
3. Tambahkan `belajar.kursusbudi.com` ke `server_name` blok port 80 di konfigurasi Nginx, `sudo nginx -t && sudo systemctl reload nginx`, lalu terbitkan sertifikatnya:
   ```bash
   sudo certbot --nginx -d belajar.kursusbudi.com
   ```

### Perintah lain
```bash
node dist/org.js daftar                                   # semua lembaga, jumlah cabang/akun, domain
node dist/org.js nonaktif --slug kursus-budi              # tutup website & login (mis. langganan berakhir)
node dist/org.js aktif --slug kursus-budi
node dist/org.js domain-hapus --domain belajar.kursusbudi.com
```
Perubahan domain/status berlaku paling lambat 1 menit (cache API).

> **Upgrade dari versi satu lembaga:** migrasi database otomatis membuat organisasi `mental-english` dan memindahkan semua data lama ke sana. Set `DEFAULT_ORG=mental-english` agar domain lama tetap langsung membuka Mental English.

## Fitur otomatis yang berjalan sendiri

- **Tagihan SPP bulanan** dibuat otomatis setiap hari pukul 06.00 WIB (dan saat API start) untuk cabang yang mengaktifkan tagihan otomatis, pada atau setelah tanggal tagihan yang diatur di menu **Pengaturan Tagihan**. Tidak pernah dobel untuk periode yang sama.
- **Pengingat** dikirim ke orang tua H-3 sebelum jatuh tempo dan sekali saat lewat jatuh tempo.
- Zona waktu memakai `Asia/Jakarta`. Untuk mengubahnya, tambahkan `TZ_APP=Asia/Makassar` (dll.) di `backend/.env`.
- Untuk mematikan sementara: `BILLING_SCHEDULER=false` di `backend/.env`, lalu `pm2 reload ecosystem.config.js --update-env`.
- Foto & video unggahan tersimpan di `backend/uploads/` (gambar maks. 8 MB, video maks. 100 MB) dan ikut di-backup oleh `deploy/backup.sh`. Pastikan disk VPS cukup jika sering mengunggah video.

## Mulai dipakai sungguhan (hapus data demo)

Hapus semua data demo, sisakan cabang Pusat (Jatimurni, Bekasi) dan satu Super Admin:

```bash
cd /var/www/mental-english
./deploy/backup.sh
cd backend && node dist/seed.js --kosong
```

Login sebagai `superadmin@mentalenglish.id` (password = `SEED_PASSWORD`), ganti password lewat **Profil Saya**, lalu isi data asli lewat menu admin.

> ⚠️ `--kosong` dan `--reset` menghapus **seluruh** data. Selalu backup dulu.

## Update ke versi terbaru

```bash
cd /var/www/mental-english
./deploy/update.sh
```

Skrip ini: backup → `git pull` → build API & website → `pm2 reload` (tanpa downtime). Migrasi database baru berjalan otomatis saat API start.

## Backup & restore

Backup database + foto unggahan ke folder `backups/` (backup lebih dari 14 hari dihapus otomatis):

```bash
./deploy/backup.sh
```

Backup otomatis tiap hari jam 02.00 — jalankan `crontab -e`, lalu tambahkan:

```
0 2 * * * cd /var/www/mental-english && ./deploy/backup.sh >> backups/backup.log 2>&1
```

Salin folder `backups/` ke tempat lain secara berkala (Google Drive, komputer lokal, dll).

**Restore database** (`DATABASE_URL` sama dengan di `backend/.env`):

```bash
zcat backups/db-YYYYMMDD-HHMMSS.sql.gz | psql "postgres://mental:PASSWORD_DB@127.0.0.1:5432/mental_english"
```

**Restore foto unggahan:**

```bash
tar -xzf backups/uploads-YYYYMMDD-HHMMSS.tar.gz -C backend
```

## Perintah berguna

```bash
pm2 status                         # status aplikasi
pm2 logs mental-english-api        # log API
pm2 logs mental-english-web        # log website
pm2 restart all                    # restart semua
pm2 monit                          # pantau CPU & memori
sudo tail -f /var/log/nginx/error.log
```

## Masalah umum

| Gejala | Penyebab & solusi |
|---|---|
| `502 Bad Gateway` | Aplikasi belum jalan / crash. Cek `pm2 status` dan `pm2 logs`. |
| Certbot gagal | DNS belum mengarah ke IP VPS, atau port 80 tertutup. Cek `ping DOMAIN` dan `sudo ufw status`. |
| Build berhenti / `Killed` | RAM kurang. Tambah swap 2 GB: `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile && echo '/swapfile none swap sw 0 0' \| sudo tee -a /etc/fstab` |
| Login gagal, muncul error koneksi | `NEXT_PUBLIC_API_URL` / `CORS_ORIGIN` tidak sesuai domain. Perbaiki, lalu build ulang website (`cd frontend && npm run build`) dan `pm2 reload ecosystem.config.js`. |
| Ganti domain | Ubah domain di `backend/.env`, `frontend/.env.production.local`, dan konfigurasi Nginx; build ulang website; `pm2 reload ecosystem.config.js --update-env`; jalankan `sudo certbot --nginx -d DOMAIN_BARU`. |
| Login gagal semua akun | Data belum diisi — jalankan langkah 7. |

## Catatan untuk developer: perubahan struktur database

Struktur database dikelola lewat migrasi (`DB_SYNC=false`, juga bawaan `backend/.env.example`). Setelah mengubah entity di `backend/src/entities`, buat migrasi baru di komputer lokal (database lokal harus sudah dimigrasi, bukan hasil `DB_SYNC=true`):

```bash
cd backend
npm run migration:generate src/migrations/NamaPerubahan
```

Commit file migrasinya, lalu jalankan `./deploy/update.sh` di server — migrasi berjalan otomatis.
