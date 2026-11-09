# Mental English

> Build Your Mental Focus!

Website kursus bahasa Inggris **Mental English** — Next.js (frontend), NestJS (API), PostgreSQL. Tema dark mode biru & navy mengikuti logo.

```
mental-english/
├── backend/    NestJS 11 + TypeORM + PostgreSQL (port 4000)
├── frontend/   Next.js 15 (App Router) + Tailwind CSS 4 (port 3000)
├── deploy/     Konfigurasi Nginx, skrip backup & update
├── ecosystem.config.js       PM2 (production)
└── docker-compose.yml        PostgreSQL untuk development (opsional)
```

**Deploy ke server (VPS, PM2 + Nginx):** ikuti [`DEPLOY.md`](DEPLOY.md).

## Menjalankan secara lokal

```bash
# 1. Database PostgreSQL (pakai PostgreSQL lokal, atau Docker jika ada)
docker compose up -d db

# 2. API
cd backend
cp .env.example .env          # sesuaikan DATABASE_URL & JWT_SECRET
npm install
npm run seed                  # buat struktur database (migrasi) + isi data demo
npm run start:dev             # http://localhost:4000

# 3. Web
cd ../frontend
cp .env.example .env.local
npm install
npm run dev                   # http://localhost:3000
```

### Akun demo (setelah `npm run seed`)

Password semua akun: `password123` (di server: nilai `SEED_PASSWORD`)

| Role | Email | Cabang saat login |
|---|---|---|
| Super admin | superadmin@mentalenglish.id | — (kosongkan) |
| Admin cabang | admin.pusat@mentalenglish.id | Mental English Pusat |
| Pengajar | teacher1.pusat@mentalenglish.id | Mental English Pusat |
| Orang tua | ortu.aisyah@mentalenglish.id | — |
| Pelajar | aisyah@mentalenglish.id | — |

Akun lain mengikuti pola `admin.bandung@…`, `teacher2.surabaya@…`, dst. Cabang **Pusat** beralamat di Jatimurni, Pondok Melati, Kota Bekasi. Cabang Bandung & Surabaya masih **contoh**, dan nomor telepon semua cabang juga contoh — ganti lewat menu **Cabang** (super admin).

## Fitur

### Halaman publik
- **Landing page** — satu section dengan background foto kegiatan; menu (Blog & Vlog, Mading, Lokasi Kami, Masuk, Daftar) berupa kartu carousel di dalam konten, tanpa header bar. Foto ada di `frontend/public/landing/`.
- **Blog & Vlog** — filter cabang, filter tipe, cari judul / nama author. Vlog menampilkan embed YouTube.
- **Mading** — karya pelajar, filter cabang & cari judul / nama author.
- **Lokasi Kami** — daftar cabang + Google Maps embed + tombol WhatsApp.
- **Masuk / Daftar** — daftar sebagai orang tua atau pelajar.

### Pelajar — `/pelajar`
Profil saya (beserta kelas yang diikuti), Mading saya (buat / ubah / hapus karya).

### Orang tua — `/orang-tua`
Profil saya, Profil anak, Dashboard anak (rasio absen, report ujian, report pengajar), Mading anak, Laporan pembayaran, Notifikasi. Pilihan anak tersedia bila punya lebih dari satu anak.

### Pengajar — `/pengajar`
- Pilih kelas di cabangnya dan **assign** diri sebagai pengajar.
- **Kelas Hari Ini** — tipe *Belajar / Ujian / Outdoor*, berisi absensi (Hadir/Izin/Sakit/Alpa), report pengajar, dan bila *Ujian* ada input nilai, grade, dan catatan per anak. Hasil langsung tampil di dashboard orang tua.

### Admin — `/admin`
CRUD Blog/Vlog, CRUD user anak, CRUD user orang tua, CRUD pengajar, CRUD kelas (nama kelas + pelajar + pengajar), moderasi mading, push notifikasi (semua orang tua cabang / per kelas / pilih penerima), update pembayaran (orang tua otomatis mendapat notifikasi saat tagihan dibuat atau status berubah).

**Super admin** dapat mengelola cabang & admin cabang, serta memilih cabang aktif di sidebar.

## Aturan cabang
- Setiap user, kelas, blog, mading, dan pembayaran terikat ke **cabang**.
- **Admin & pengajar wajib memilih cabang saat login** dan hanya bisa masuk ke cabangnya sendiri (`401 Akun Anda tidak terdaftar di cabang ini`).
- Seluruh endpoint admin/pengajar dibatasi ke cabang miliknya di sisi server, termasuk saat mengakses data lewat ID.

## Branding
- Favicon, apple icon, dan Open Graph / Twitter image dibuat dari logo: `frontend/app/{favicon.ico,icon.png,apple-icon.png,opengraph-image.png,twitter-image.png}`.
- Set `NEXT_PUBLIC_SITE_URL` ke domain produksi agar URL `og:image` benar.

## Catatan teknis
- Struktur database dikelola lewat **migrasi** (`backend/src/migrations`) dan dijalankan otomatis saat API start. Setelah mengubah entity: `npm run migration:generate src/migrations/NamaPerubahan`.
- Ganti `JWT_SECRET` dengan nilai acak yang panjang.
- File unggahan disimpan di `backend/uploads/` dan ikut di-backup oleh `deploy/backup.sh`.
- Notifikasi bersifat in-app (badge di sidebar orang tua, diperbarui tiap 30 detik).

## Dokumentasi

- [`docs/Mental-English-Gambaran-Sistem.pdf`](docs/Mental-English-Gambaran-Sistem.pdf): gambaran sistem untuk umum (tanpa pembahasan teknis), beserta screenshot.
- [`docs/Mental-English-Penjelasan-Sistem.pdf`](docs/Mental-English-Penjelasan-Sistem.pdf): versi lengkap, termasuk arsitektur, keamanan, langkah berikutnya, dan akun demo.
