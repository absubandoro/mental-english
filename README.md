# Nofosys

Platform sistem kursus & bimbel **white-label**: satu aplikasi untuk banyak lembaga, masing-masing tampil dengan nama, logo, warna, dan domainnya sendiri.
Klien pertama: **Mental English** — *Build Your Mental Focus!*

Next.js (frontend), NestJS (API), PostgreSQL.

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
| Keuangan | keuangan.pusat@mentalenglish.id | Mental English Pusat |
| Orang tua | ortu.aisyah@mentalenglish.id | — |
| Pelajar | aisyah@mentalenglish.id | — |

**Klien contoh kedua — Kursus Contoh** (buka `http://kursus-contoh.localhost:3000`, data terpisah penuh dari Mental English):
`superadmin@kursuscontoh.id`, `admin@kursuscontoh.id` (cabang Kursus Contoh Depok), `pengajar@kursuscontoh.id`, `ortu@kursuscontoh.id`, `raka@kursuscontoh.id`.

**Panel pengelola Nofosys** — buka `http://platform.localhost:3000/platform`, login `owner@nofosys.id` (password sama). Website produk Nofosys: `http://platform.localhost:3000`.

Mental English juga bisa dibuka di `http://mental-english.localhost:3000` (`http://localhost:3000` diarahkan ke Mental English lewat `DEFAULT_ORG`).

Akun lain mengikuti pola `admin.bandung@…`, `teacher2.surabaya@…`, dst. Cabang **Pusat** beralamat di Jatimurni, Pondok Melati, Kota Bekasi. Cabang Bandung & Surabaya masih **contoh**, dan nomor telepon semua cabang juga contoh — ganti lewat menu **Cabang** (super admin).

## Fitur

### Halaman publik
- **Landing page** — satu section dengan background foto kegiatan; menu (Blog & Vlog, Mading, Lokasi Kami, Masuk, Daftar) berupa kartu carousel di dalam konten, tanpa header bar. Foto ada di `frontend/public/landing/`.
- **Blog & Vlog** — filter cabang, filter tipe, cari judul / nama author. Vlog menampilkan embed YouTube.
- **Mading** — karya pelajar, filter cabang & cari judul / nama author.
- **Lokasi Kami** — daftar cabang + Google Maps embed + tombol WhatsApp.
- **Masuk / Daftar Siswa** — formulir pendaftaran siswa baru (data siswa & orang tua), ditinjau admin cabang.

### Pelajar — `/pelajar`
Profil saya, Mading saya (karya dengan foto/video), Kalender, Rapor.

### Orang tua — `/orang-tua`
Profil saya, Profil anak, Dashboard anak (rasio absen, report ujian, report pengajar + foto/video kegiatan), **Rapor anak** (bisa dicetak / PDF), **Kalender**, Mading anak, **Pembayaran** (unggah bukti transfer, lihat rekening cabang, alasan bila bukti ditolak), Notifikasi.

### Pengajar — `/pengajar`
- **Kelas Hari Ini**: jadwal saya hari ini (dari jadwal kelas), tipe *Belajar / Ujian / Outdoor*, absensi, report pengajar, nilai ujian, dan **lampiran foto/video kegiatan**.
- **Kalender**: jadwal kelas yang diajar + agenda cabang; ketuk jadwal untuk mengisi absensi.
- **Rapor**: buat rapor per pelajar atau satu kelas sekaligus — nilai 8 aspek (Speaking, Listening, Reading, Writing, Vocabulary, Grammar, Mental & Kepercayaan Diri, Fokus & Konsentrasi), kehadiran & nilai ujian terisi otomatis, catatan, saran, lampiran, lalu terbitkan.
- Kelas yang diajar (assign diri), Notifikasi.

### Keuangan — `/keuangan`
Peran baru, terkunci per cabang: **verifikasi bukti pembayaran** (terima / tolak dengan alasan), pantau semua tagihan, **pengaturan tagihan otomatis**, kalender.

### Admin — `/admin`
- **Pendaftaran siswa**: calon siswa dari halaman Daftar → hubungi via WhatsApp → **Terima** (akun orang tua & pelajar dibuat otomatis, bisa langsung masuk kelas) atau tolak.
- **Kalender cabang**: agenda libur / acara / ujian (bisa per kelas, opsi notifikasi ke orang tua). Jadwal kelas otomatis tampil dan ditandai libur.
- **Kelas** dengan jadwal mingguan (hari + jam + ruang) yang tersinkron ke kalender.
- **Pembayaran & Pengaturan Tagihan**: tanggal tagihan tiap bulan (1–28), nominal SPP (bisa khusus per pelajar), jatuh tempo, rekening; verifikasi bukti transfer.
- **Rapor**, Blog & Vlog (galeri foto/video, unggah video langsung atau link YouTube), moderasi mading, user anak / orang tua / pengajar / keuangan, push notifikasi, kotak masuk.

**Super admin** dapat mengelola cabang & admin cabang, serta memilih cabang aktif di sidebar.

## Multi-lembaga (satu aplikasi untuk banyak klien)

Hierarki data: **Platform Nofosys → Organisasi (lembaga/klien) → Cabang → User, kelas, tagihan, blog, mading, rapor, dst.** Mental English adalah organisasi pertama.

- **Domain platform** (`PLATFORM_DOMAIN`, `www.`, `platform.`; lokal: `platform.localhost`) menampilkan **landing page Nofosys** (hero dengan mockup yang berganti merek, fitur, white-label, peran, FAQ, dan form *Minta demo* yang masuk ke menu **Permintaan Demo** di panel) serta **panel pengelola** `/platform`: daftar lembaga & statistik, buat lembaga baru (website + Super Admin langsung aktif), domain kustom, aktif/nonaktif, reset password Super Admin lembaga, catatan internal, dan akun pengelola. Akun pengelola terpisah dari akun lembaga (tabel `platform_admins`, token khusus yang hanya berlaku di domain platform).
- **Tagihan langganan sistem**: pengelola mengatur paket, biaya (tetap + per pelajar aktif), dan tanggal jatuh tempo per lembaga. Tagihan terbit otomatis (06.10 WIB) ke menu **Langganan Sistem** Super Admin lembaga (banner di Ringkasan + notifikasi H-3 & terlambat); lembaga mengunggah bukti transfer, pengelola memverifikasi di panel **Tagihan Langganan**.
- **Organisasi dikenali dari domain yang dibuka**, berurutan: `<slug>.PLATFORM_DOMAIN` (mis. `mental-english.nofosys.id`) → `<slug>.localhost` (lokal) → domain kustom terdaftar (mis. `mentalenglish.id`) → `DEFAULT_ORG` (cadangan, mis. untuk `localhost`).
  Website mengirim header `X-Tenant-Host`; di server, Nginx meneruskan `Host` asli.
- **Login hanya mencari akun di organisasi domain tersebut**; email yang sama boleh terdaftar di dua lembaga. Token login ditolak bila dipakai di domain lembaga lain.
- **Semua data dibatasi per organisasi di sisi server**: Super Admin hanya melihat cabang milik organisasinya; endpoint publik (cabang, blog, mading, pendaftaran) hanya menampilkan data lembaga dari domain itu. File unggahan disimpan di `uploads/<organizationId>/`.
- **White-label**: nama, tagline, deskripsi, logo, warna merek, foto landing, dan kontak diatur Super Admin di menu **Identitas Lembaga** (`/admin/lembaga`). Favicon, ikon aplikasi HP, manifest, judul halaman, preview link (`/opengraph-image`), dan kop rapor otomatis mengikuti.
- **Kelola organisasi** lewat panel, atau dari terminal server (lihat DEPLOY.md):
  ```bash
  node dist/org.js daftar
  node dist/org.js tambah --slug kursus-budi --nama "Kursus Budi" --email superadmin@kursusbudi.com [--domain belajar.kursusbudi.com] [--warna "#16a34a"]
  node dist/org.js domain-tambah --slug kursus-budi --domain belajar.kursusbudi.com
  node dist/org.js nonaktif --slug kursus-budi
  node dist/org.js pengelola --email anda@nofosys.id   # akun pengelola platform / reset password
  ```
  Lokal: `npm run org -- daftar`.

## Aturan cabang
- Setiap user, kelas, blog, mading, dan pembayaran terikat ke **cabang**.
- **Admin, pengajar & keuangan wajib memilih cabang saat login** dan hanya bisa masuk ke cabangnya sendiri (`401 Akun Anda tidak terdaftar di cabang ini`).
- Seluruh endpoint admin/pengajar dibatasi ke cabang miliknya di sisi server, termasuk saat mengakses data lewat ID.

## Branding
- Branding diambil dari data organisasi (menu **Identitas Lembaga**), bukan dari kode. Warna merek menimpa variabel tema `--color-brand-*`.
- Favicon & ikon aplikasi: `/brand/icon?size=…` (logo lembaga, atau inisial berwarna merek bila belum ada logo). Preview link: `/opengraph-image`.

## Catatan teknis
- Struktur database dikelola lewat **migrasi** (`backend/src/migrations`) dan dijalankan otomatis saat API start. Setelah mengubah entity: `npm run migration:generate src/migrations/NamaPerubahan`.
- Ganti `JWT_SECRET` dengan nilai acak yang panjang.
- File unggahan disimpan di `backend/uploads/` dan ikut di-backup oleh `deploy/backup.sh`.
- Notifikasi bersifat in-app (badge di sidebar orang tua, diperbarui tiap 30 detik).

## Dokumentasi

- [`docs/Mental-English-Gambaran-Sistem.pdf`](docs/Mental-English-Gambaran-Sistem.pdf): gambaran sistem untuk umum (tanpa pembahasan teknis), beserta screenshot.
- [`docs/Mental-English-Penjelasan-Sistem.pdf`](docs/Mental-English-Penjelasan-Sistem.pdf): versi lengkap, termasuk arsitektur, keamanan, langkah berikutnya, dan akun demo.
