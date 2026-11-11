# Deploy Nofosys ke VPS (PM2 + Nginx)

Panduan memasang platform **Nofosys** di VPS **tanpa Docker**. Satu instalasi melayani banyak lembaga (klien); **Mental English** adalah klien pertama.

```
Internet ──► Nginx (80/443, HTTPS Let's Encrypt)
               │  nofosys.id            → website produk Nofosys + panel pengelola (/platform)
               │  *.nofosys.id          → website lembaga, mis. mental-english.nofosys.id
               │  mentalenglish.id      → domain sendiri milik klien (opsional)
               ├── /      ► PM2: nofosys-web  (Next.js, 127.0.0.1:3000)
               └── /api/  ► PM2: nofosys-api  (NestJS, 127.0.0.1:4000) ──► PostgreSQL (lokal)
```

Lembaga dikenali dari **domain yang dibuka**. Semua lembaga memakai aplikasi, database, dan server yang sama, dengan data, akun, dan tampilan yang terpisah.

File yang dipakai: `ecosystem.config.js` (PM2), `deploy/nginx.conf`, `backend/.env.production.example`, `frontend/.env.production.example`, `deploy/backup.sh`, `deploy/update.sh`.

Contoh di panduan ini memakai domain platform **`nofosys.id`**, domain klien **`mentalenglish.id`**, dan folder **`/var/www/nofosys`** — ganti sesuai milik Anda.

---

## 1. Siapkan VPS & DNS

**Spesifikasi minimal:** Ubuntu 22.04 / 24.04, **2 GB RAM**, 2 vCPU, 25 GB disk.
(Dengan 1 GB RAM, proses build bisa gagal kehabisan memori — tambahkan swap, lihat *Masalah umum*.)

**DNS domain platform** (di panel tempat beli domain `nofosys.id`):

| Tipe | Nama | Nilai | Untuk |
|---|---|---|---|
| A | `@` | IP publik VPS | website Nofosys + panel |
| A | `*` | IP publik VPS | subdomain semua klien (`<slug>.nofosys.id`) |

Tunggu sampai `ping nofosys.id` dan `ping mental-english.nofosys.id` menunjukkan IP VPS.

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
CREATE ROLE nofosys LOGIN PASSWORD 'PASSWORD_DB';
CREATE DATABASE nofosys OWNER nofosys;
\q
```

## 4. Ambil kode

```bash
sudo mkdir -p /var/www/nofosys && sudo chown $USER /var/www/nofosys
git clone -b main https://github.com/absubandoro/mental-english.git /var/www/nofosys
cd /var/www/nofosys
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
| `PLATFORM_DOMAIN` | domain platform, mis. `nofosys.id` |
| `CORS_ORIGIN` | `https://*.nofosys.id` |
| `PUBLIC_URL` | `/api` (biarkan — berlaku untuk semua domain lembaga) |
| `PLATFORM_WHATSAPP` / `PLATFORM_EMAIL` | kontak di website Nofosys (opsional) |
| `DEFAULT_ORG` | kosongkan |
| `SEED_PASSWORD` | password akun demo, Super Admin, & pengelola platform — **jangan** `password123` |
| `SEED_PLATFORM_EMAIL` | email akun pengelola platform Anda |

**Website** — `frontend/.env.production.local`:

```bash
cp frontend/.env.production.example frontend/.env.production.local
nano frontend/.env.production.local      # NEXT_PUBLIC_API_URL tetap /api; ganti nofosys.id di NEXT_PUBLIC_SITE_URL
```

## 6. Build

```bash
cd /var/www/nofosys/backend  && npm ci && npm run build
cd /var/www/nofosys/frontend && npm ci && npm run build
cd /var/www/nofosys
```

## 7. Isi data

```bash
cd backend && node dist/seed.js && cd ..
```

Perintah ini membuat struktur database (migrasi) lalu mengisi data demo:
- **Mental English** (3 cabang: Pusat + 2 contoh) beserta akun pelajar, orang tua, pengajar, admin, keuangan, blog, mading, pembayaran, rapor;
- klien contoh kedua **Kursus Contoh** (untuk mencoba pemisahan data);
- akun **pengelola platform** `SEED_PLATFORM_EMAIL`.

Semua akun memakai password `SEED_PASSWORD`; daftar akun ada di README (*Akun demo*).
Ingin mulai tanpa data demo? Lihat *Mulai dipakai sungguhan* di bawah.

## 8. Jalankan dengan PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup          # jalankan perintah "sudo env PATH=..." yang ditampilkan, agar otomatis jalan saat VPS restart
pm2 install pm2-logrotate   # log tidak memenuhi disk
```

Cek: `pm2 status` → `nofosys-api` dan `nofosys-web` harus **online**.

## 9. Nginx

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/nofosys
sudo nano /etc/nginx/sites-available/nofosys     # ganti nofosys.id dengan domain platform Anda
sudo ln -s /etc/nginx/sites-available/nofosys /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

## 10. HTTPS untuk domain platform & semua subdomain (wildcard)

Satu sertifikat wildcard berlaku untuk `nofosys.id` dan **semua** `*.nofosys.id`, jadi klien baru tidak perlu sertifikat tambahan. Let's Encrypt mewajibkan verifikasi lewat DNS untuk wildcard:

```bash
sudo certbot certonly --manual --preferred-challenges dns -d nofosys.id -d '*.nofosys.id'
```

Certbot meminta Anda menambahkan record **TXT `_acme-challenge`** di panel domain; tunggu ±1 menit setelah menambahkannya sebelum menekan Enter.

> Cara manual ini harus diulang tiap ±90 hari. Agar perpanjangan otomatis, pakai plugin DNS penyedia domain Anda — mis. pindahkan DNS ke Cloudflare (gratis) lalu pakai `python3-certbot-dns-cloudflare`.

Lalu edit `/etc/nginx/sites-available/nofosys`:
1. Salin seluruh blok `server { ... }` menjadi blok kedua, ubah `listen 80;` / `listen [::]:80;` menjadi `listen 443 ssl;` / `listen [::]:443 ssl;`, dan tambahkan:
   ```nginx
   ssl_certificate     /etc/letsencrypt/live/nofosys.id/fullchain.pem;
   ssl_certificate_key /etc/letsencrypt/live/nofosys.id/privkey.pem;
   ```
2. Di blok port 80, ganti kedua `location` dengan: `return 301 https://$host$request_uri;`

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Selesai 🎉

- `https://nofosys.id` — website produk Nofosys
- `https://nofosys.id/platform` — **panel pengelola** (login dengan `SEED_PLATFORM_EMAIL` / `SEED_PASSWORD`)
- `https://mental-english.nofosys.id` — website Mental English

---

## Mengelola klien

Semua dilakukan di **panel pengelola** `https://nofosys.id/platform`:

- **Lembaga baru** — isi nama, slug, dan email pemilik. Website langsung aktif di `https://<slug>.nofosys.id` beserta akun Super Admin dan password awal (salin & kirim ke klien). Klien login, mengganti password, lalu mengisi **Identitas Lembaga** (logo, warna, foto, kontak).
- **Nonaktifkan / aktifkan** — menutup website & login lembaga (mis. langganan berakhir) tanpa menghapus data.
- **Reset password** Super Admin lembaga, tambah Super Admin, ubah nama/slug, catatan internal.
- **Pengelola & Akun** — tambah rekan pengelola platform, ganti password sendiri.

Perintah yang sama tersedia lewat terminal (mis. bila lupa password pengelola):

```bash
cd /var/www/nofosys/backend
node dist/org.js daftar
node dist/org.js tambah --slug kursus-budi --nama "Kursus Budi" --email superadmin@kursusbudi.com
node dist/org.js nonaktif --slug kursus-budi
node dist/org.js pengelola --email anda@nofosys.id        # buat pengelola / reset password-nya
```

### Domain milik klien (mis. `mentalenglish.id`)

1. Di panel → buka lembaga → **Alamat website** → tambahkan `mentalenglish.id`.
2. Klien mengarahkan domainnya ke server, di panel domain mereka:
   - domain utama (`mentalenglish.id`): `A @ → IP VPS`
   - subdomain (`belajar.kursusbudi.com`): `CNAME belajar → nofosys.id`
3. Di server, tambahkan domain itu ke `server_name` blok port 80 di `/etc/nginx/sites-available/nofosys`, lalu:
   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   sudo certbot --nginx -d mentalenglish.id
   ```
   Certbot membuat blok HTTPS untuk domain tersebut dan memperpanjangnya otomatis.

Perubahan domain/status dari panel berlaku paling lambat 1 menit (cache API).

---

## Fitur otomatis yang berjalan sendiri

- **Tagihan SPP bulanan** dibuat otomatis setiap hari pukul 06.00 WIB (dan saat API start) untuk cabang yang mengaktifkan tagihan otomatis, pada atau setelah tanggal tagihan yang diatur di menu **Pengaturan Tagihan**. Tidak pernah dobel untuk periode yang sama.
- **Pengingat** dikirim ke orang tua H-3 sebelum jatuh tempo dan sekali saat lewat jatuh tempo.
- Zona waktu memakai `Asia/Jakarta`. Untuk mengubahnya, tambahkan `TZ_APP=Asia/Makassar` (dll.) di `backend/.env`.
- Untuk mematikan sementara: `BILLING_SCHEDULER=false` di `backend/.env`, lalu `pm2 reload ecosystem.config.js --update-env`.
- Foto & video unggahan tersimpan di `backend/uploads/<id-lembaga>/` (gambar maks. 8 MB, video maks. 100 MB) dan ikut di-backup oleh `deploy/backup.sh`. Pastikan disk VPS cukup jika sering mengunggah video.

## Mulai dipakai sungguhan (hapus data demo)

Hapus semua data demo; sisakan lembaga Mental English (cabang Pusat, Jatimurni Bekasi + satu Super Admin) dan akun pengelola platform:

```bash
cd /var/www/nofosys
./deploy/backup.sh
cd backend && node dist/seed.js --kosong
```

Login sebagai `superadmin@mentalenglish.id` di `https://mental-english.nofosys.id` dan sebagai pengelola di `https://nofosys.id/platform` (password keduanya = `SEED_PASSWORD`), lalu ganti password masing-masing.

> ⚠️ `--kosong` dan `--reset` menghapus **seluruh** data semua lembaga. Selalu backup dulu.

## Update ke versi terbaru

```bash
cd /var/www/nofosys
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
0 2 * * * cd /var/www/nofosys && ./deploy/backup.sh >> backups/backup.log 2>&1
```

Salin folder `backups/` ke tempat lain secara berkala (Google Drive, komputer lokal, dll).

**Restore database** (`DATABASE_URL` sama dengan di `backend/.env`):

```bash
zcat backups/db-YYYYMMDD-HHMMSS.sql.gz | psql "postgres://nofosys:PASSWORD_DB@127.0.0.1:5432/nofosys"
```

**Restore foto unggahan:**

```bash
tar -xzf backups/uploads-YYYYMMDD-HHMMSS.tar.gz -C backend
```

## Perintah berguna

```bash
pm2 status                         # status aplikasi
pm2 logs nofosys-api               # log API
pm2 logs nofosys-web               # log website
pm2 restart all                    # restart semua
pm2 monit                          # pantau CPU & memori
sudo tail -f /var/log/nginx/error.log
```

## Masalah umum

| Gejala | Penyebab & solusi |
|---|---|
| `502 Bad Gateway` | Aplikasi belum jalan / crash. Cek `pm2 status` dan `pm2 logs`. |
| "Lembaga tidak ditemukan untuk domain ini" | Slug salah, atau domain kustom belum ditambahkan di panel → lembaga → Alamat website. |
| "Layanan lembaga ini sedang tidak aktif" | Lembaga dinonaktifkan di panel. Aktifkan lagi di panel. |
| Subdomain klien tidak terbuka | Record DNS `A *` belum dibuat / belum menyebar. Cek `ping slug.nofosys.id`. |
| Certbot wildcard gagal | Record TXT `_acme-challenge` belum menyebar; tunggu beberapa menit lalu ulangi. |
| Certbot domain klien gagal | DNS klien belum mengarah ke IP VPS, atau domain belum ada di `server_name`. |
| Build berhenti / `Killed` | RAM kurang. Tambah swap 2 GB: `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile && echo '/swapfile none swap sw 0 0' \| sudo tee -a /etc/fstab` |
| Lupa password panel pengelola | `cd backend && node dist/org.js pengelola --email EMAIL_ANDA` → password baru ditampilkan. |
| Ganti domain platform | Ubah `PLATFORM_DOMAIN`/`CORS_ORIGIN` di `backend/.env`, `NEXT_PUBLIC_SITE_URL` di `frontend/.env.production.local`, dan `server_name` Nginx; build ulang website; `pm2 reload ecosystem.config.js --update-env`; terbitkan sertifikat wildcard baru. |

## Catatan untuk developer: perubahan struktur database

Struktur database dikelola lewat migrasi (`DB_SYNC=false`, juga bawaan `backend/.env.example`). Setelah mengubah entity di `backend/src/entities`, buat migrasi baru di komputer lokal (database lokal harus sudah dimigrasi, bukan hasil `DB_SYNC=true`):

```bash
cd backend
npm run migration:generate src/migrations/NamaPerubahan
```

Commit file migrasinya, lalu jalankan `./deploy/update.sh` di server — migrasi berjalan otomatis.
