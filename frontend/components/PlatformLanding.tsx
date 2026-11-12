import {
  ArrowRight, Bell, Building2, CalendarDays, Camera, Check, ChevronDown, CreditCard, FileBadge, Globe2, Layers, Lock, Mail, MessageCircle,
  Newspaper, Palette, ReceiptText, School, ShieldCheck, Smartphone, UserPlus, Users, X,
} from 'lucide-react';
import Link from 'next/link';
import type { Org } from '@/lib/org';
import { waLink } from '@/lib/org';
import { DemoForm } from './nofosys/DemoForm';
import { HeroShowcase } from './nofosys/HeroShowcase';
import { NavBar } from './nofosys/NavBar';
import { NofosysMark } from './nofosys/NofosysMark';
import { Reveal } from './nofosys/Reveal';
import { RoleTabs } from './nofosys/RoleTabs';

const MARQUEE = [
  'Pendaftaran online', 'Absensi', 'Rapor perkembangan', 'Tagihan SPP otomatis', 'Verifikasi transfer', 'Kalender cabang', 'Push notifikasi',
  'Mading karya siswa', 'Blog & vlog', 'Multi-cabang', 'Aplikasi HP', 'Domain sendiri',
];

const BEFORE = [
  'Tagihan SPP ditulis manual & ditagih satu per satu lewat chat',
  'Bukti transfer tenggelam di grup WhatsApp',
  'Rapor dibuat di Word, dicetak, sering terlambat',
  'Orang tua terus bertanya “anak saya hadir tidak?”',
  'Jadwal & hari libur diumumkan berulang-ulang',
  'Data siswa tersebar di banyak file & HP admin',
];
const AFTER = [
  'Tagihan dibuat otomatis tiap bulan, lengkap dengan pengingat',
  'Orang tua unggah bukti, admin verifikasi sekali klik',
  'Rapor per aspek, rekap absen & nilai otomatis, siap PDF',
  'Absensi & nilai tampil di HP orang tua setelah kelas',
  'Kalender cabang tersinkron dengan jadwal setiap kelas',
  'Semua data rapi di satu sistem, per cabang',
];

const STEPS = [
  { title: 'Konsultasi & demo', desc: 'Ceritakan lembaga Anda. Kami tunjukkan sistemnya langsung dengan contoh data.' },
  { title: 'Lembaga Anda kami siapkan', desc: 'Website, subdomain, dan akun Super Admin aktif dalam hitungan menit.' },
  { title: 'Atur identitas, bagikan', desc: 'Unggah logo, pilih warna, isi cabang & siswa, lalu bagikan link ke orang tua.' },
];

const FAQ = [
  ['Apakah orang tua harus memasang aplikasi dari Play Store?', 'Tidak perlu. Website lembaga Anda bisa dipasang ke layar utama HP Android maupun iPhone langsung dari browser, dan terbuka layar penuh seperti aplikasi — dengan nama dan ikon lembaga Anda.'],
  ['Bisakah memakai domain milik lembaga sendiri?', 'Bisa. Setiap lembaga langsung mendapat subdomain, dan Anda bisa menghubungkan domain sendiri (mis. belajar.namalembaga.com) lengkap dengan HTTPS.'],
  ['Apakah data lembaga kami bisa dilihat lembaga lain?', 'Tidak. Data setiap lembaga terpisah penuh di sisi server: akun, siswa, tagihan, rapor, hingga file unggahan. Akun satu lembaga tidak berlaku di lembaga lain.'],
  ['Kami punya beberapa cabang. Apakah didukung?', 'Ya. Super Admin melihat semua cabang, sedangkan admin, pengajar, dan bagian keuangan hanya bisa mengakses cabangnya sendiri.'],
  ['Bagaimana orang tua membayar SPP?', 'Orang tua mentransfer ke rekening lembaga seperti biasa, lalu mengunggah foto bukti transfer. Admin atau bagian keuangan memverifikasi. Uang langsung masuk ke rekening lembaga, tidak melalui kami.'],
  ['Berapa lama sampai bisa dipakai?', 'Website dan akun aktif di hari yang sama. Pengisian data cabang, kelas, dan siswa tergantung jumlah siswa — kami bantu di awal.'],
  ['Berapa biayanya?', 'Biaya menyesuaikan jumlah siswa aktif dan cabang. Isi form demo di bawah, kami kirimkan penawaran yang pas untuk lembaga Anda.'],
];

/** Judul bagian (tanpa badge di atasnya) */
function SectionHead({ title, desc }: { eyebrow?: string; title: React.ReactNode; desc?: string }) {
  return (
    <Reveal className="mx-auto max-w-3xl text-center">
      <h2 className="text-3xl leading-tight font-extrabold tracking-tight text-white sm:text-5xl">{title}</h2>
      {desc && <p className="mt-4 text-base text-slate-400 sm:text-lg">{desc}</p>}
    </Reveal>
  );
}

/** Kartu fitur pada grid bento */
function Bento({ className = '', icon: Icon, title, desc, children, delay = 0 }: { className?: string; icon: typeof Check; title: string; desc: string; children?: React.ReactNode; delay?: number }) {
  return (
    <Reveal delay={delay} className={`group relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-b from-white/[0.05] to-white/[0.015] p-6 transition hover:border-violet-400/30 ${className}`}>
      <div aria-hidden className="absolute -top-24 -right-24 size-48 rounded-full bg-violet-500/10 blur-3xl transition group-hover:bg-violet-500/20" />
      <span className="relative flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-cyan-400/20 text-violet-200 ring-1 ring-white/10">
        <Icon className="size-5" />
      </span>
      <h3 className="relative mt-4 text-lg font-bold text-white">{title}</h3>
      <p className="relative mt-1.5 text-sm leading-relaxed text-slate-400">{desc}</p>
      {children && <div className="relative mt-6">{children}</div>}
    </Reveal>
  );
}

const pill = 'rounded-full px-2 py-0.5 text-[10px] font-semibold';

/** Beranda di domain platform: website produk Nofosys */
export function PlatformLanding({ org }: { org: Org }) {
  const wa = org.whatsapp ? waLink(org.whatsapp, `Halo ${org.name}, saya ingin tahu lebih lanjut untuk lembaga saya.`) : null;

  return (
    <div className="relative min-h-dvh overflow-x-clip bg-[#05060f] text-slate-200">
      <NavBar name={org.name} />

      {/* ================= HERO ================= */}
      <section className="relative pt-28 pb-24 sm:pt-36 sm:pb-32">
        <div aria-hidden className="nf-grid-bg absolute inset-0" />
        <div aria-hidden className="nf-glow absolute top-0 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-violet-600/25 blur-[120px]" />
        <div aria-hidden className="absolute top-40 right-0 h-80 w-80 rounded-full bg-cyan-500/15 blur-[100px]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-4 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          <div>
            <Reveal>
              <h1 className="text-[42px] leading-[1.05] font-extrabold tracking-tight text-white sm:text-6xl xl:text-7xl">
                Sistem lembaga belajar lengkap, <span className="nf-text-gradient">atas nama lembaga Anda.</span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
                Website, aplikasi HP, absensi, rapor, dan tagihan SPP otomatis — tampil dengan logo, warna, dan domain Anda sendiri. Orang tua tidak pernah
                melihat nama kami.
              </p>
            </Reveal>
            <Reveal delay={240} className="mt-9 flex flex-wrap gap-3">
              <a
                href="#demo"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_40px_-10px_rgba(139,92,246,0.9)] transition hover:brightness-110"
              >
                Minta demo gratis <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
              </a>
              <a href="#fitur" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/5">
                Lihat fitur
              </a>
            </Reveal>
            <Reveal delay={320} className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
              {['Tanpa Play Store', 'Aktif dalam hitungan menit', 'Data tiap lembaga terpisah'].map((t) => (
                <span key={t} className="flex items-center gap-2">
                  <Check className="size-4 text-cyan-300" /> {t}
                </span>
              ))}
            </Reveal>
          </div>
          <Reveal delay={200} className="px-2 sm:px-6 lg:px-0">
            <HeroShowcase />
          </Reveal>
        </div>
      </section>

      {/* ================= MARQUEE ================= */}
      <div className="relative border-y border-white/8 bg-white/[0.02] py-5 [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
        <div className="nf-marquee flex w-max gap-10">
          {[...MARQUEE, ...MARQUEE].map((t, i) => (
            <span key={i} className="flex items-center gap-10 text-sm font-medium whitespace-nowrap text-slate-400">
              {t} <span className="size-1.5 rounded-full bg-gradient-to-r from-violet-400 to-cyan-300" />
            </span>
          ))}
        </div>
      </div>

      {/* ================= MASALAH ================= */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-8 sm:py-32">
        <SectionHead eyebrow="Kenapa Nofosys" title="Masih mengelola lembaga lewat WhatsApp & Excel?" desc="Waktu admin habis untuk menagih, mencari bukti transfer, dan menjawab pertanyaan yang sama. Saatnya pindah." />
        <div className="mt-14 grid gap-5 md:grid-cols-2">
          <Reveal className="rounded-3xl border border-white/8 bg-white/[0.02] p-7">
            <div className="text-sm font-semibold tracking-wider text-slate-500 uppercase">Sebelum</div>
            <ul className="mt-5 space-y-4">
              {BEFORE.map((t) => (
                <li key={t} className="flex gap-3 text-slate-400">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-rose-500/15">
                    <X className="size-3 text-rose-300" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={120} className="nf-border-glow rounded-3xl p-7 shadow-[0_0_80px_-30px_rgba(139,92,246,0.6)]">
            <div className="flex items-center gap-2 text-sm font-semibold tracking-wider text-violet-200 uppercase">
              <NofosysMark size={20} /> Dengan {org.name}
            </div>
            <ul className="mt-5 space-y-4">
              {AFTER.map((t) => (
                <li key={t} className="flex gap-3 text-slate-200">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400">
                    <Check className="size-3 text-white" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ================= FITUR (BENTO) ================= */}
      <section id="fitur" className="scroll-mt-20 mx-auto max-w-7xl px-4 pb-24 sm:px-8 sm:pb-32">
        <SectionHead
          eyebrow="Fitur"
          title={
            <>
              Semua yang dibutuhkan lembaga, <span className="nf-text-gradient">dalam satu sistem</span>
            </>
          }
          desc="Untuk pengunjung, pelajar, orang tua, pengajar, admin cabang, dan bagian keuangan."
        />
        <div className="mt-14 grid gap-4 md:grid-cols-6">
          <Bento className="md:col-span-3" icon={FileBadge} title="Rapor perkembangan" desc="Nilai per aspek, catatan & saran pengajar, rekap kehadiran dan ujian otomatis. Terbit ke orang tua, siap cetak PDF.">
            <div className="rounded-2xl bg-[#0b0f22] p-4 ring-1 ring-white/8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] tracking-wider text-violet-300 uppercase">Rapor · November</div>
                  <div className="text-sm font-semibold text-white">Alya Putri · Kids Explorer A</div>
                </div>
                <div className="text-4xl font-extrabold text-white">A</div>
              </div>
              <div className="mt-4 space-y-2.5">
                {[
                  ['Speaking', 92],
                  ['Listening', 85],
                  ['Vocabulary', 88],
                  ['Percaya diri', 95],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center gap-3 text-xs">
                    <span className="w-24 text-slate-400">{k}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/8">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${v}%` }} />
                    </div>
                    <span className="w-6 text-right font-semibold text-white">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </Bento>

          <Bento className="md:col-span-3" delay={80} icon={ReceiptText} title="Tagihan SPP otomatis" desc="Tagihan dibuat sendiri di tanggal pilihan Anda, pengingat H-3 terkirim, orang tua unggah bukti, admin tinggal verifikasi.">
            <div className="space-y-2.5">
              {[
                ['SPP Desember', 'Alya Putri', 'Menunggu verifikasi', 'bg-amber-400/15 text-amber-200'],
                ['SPP Desember', 'Raka Pratama', 'Lunas', 'bg-emerald-400/15 text-emerald-300'],
                ['SPP Desember', 'Nara Ayu', 'Jatuh tempo 3 hari', 'bg-rose-400/15 text-rose-200'],
              ].map(([t, n, s, c]) => (
                <div key={n} className="flex items-center gap-3 rounded-2xl bg-[#0b0f22] px-4 py-3 ring-1 ring-white/8">
                  <CreditCard className="size-4 text-slate-500" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white">{n}</div>
                    <div className="text-[11px] text-slate-500">{t} · Rp 450.000</div>
                  </div>
                  <span className={`${pill} ${c}`}>{s}</span>
                </div>
              ))}
            </div>
          </Bento>

          <Bento className="md:col-span-2" delay={0} icon={School} title="Kelas hari ini & absensi" desc="Kelas muncul otomatis dari jadwal. Absensi, nilai, foto & video dalam satu layar.">
            <div className="grid grid-cols-2 gap-2">
              {[
                ['Alya', 'H', 'bg-emerald-400/20 text-emerald-300'],
                ['Bima', 'H', 'bg-emerald-400/20 text-emerald-300'],
                ['Citra', 'I', 'bg-sky-400/20 text-sky-200'],
                ['Dimas', 'S', 'bg-amber-400/20 text-amber-200'],
              ].map(([n, s, c]) => (
                <div key={n} className="flex items-center justify-between rounded-xl bg-[#0b0f22] px-3 py-2 text-xs ring-1 ring-white/8">
                  <span className="text-slate-300">{n}</span>
                  <span className={`flex size-6 items-center justify-center rounded-lg text-[11px] font-bold ${c}`}>{s}</span>
                </div>
              ))}
            </div>
          </Bento>

          <Bento className="md:col-span-2" delay={80} icon={CalendarDays} title="Kalender cabang" desc="Libur, acara, dan ujian per cabang — tersinkron dengan jadwal setiap kelas.">
            <div className="grid grid-cols-7 gap-1.5 text-center text-[10px]">
              {Array.from({ length: 21 }, (_, d) => {
                const mark = { 3: 'bg-violet-400', 8: 'bg-cyan-300', 10: 'bg-violet-400', 15: 'bg-rose-400', 17: 'bg-violet-400' }[d];
                return (
                  <div key={d} className={`relative rounded-lg py-1.5 ${d === 15 ? 'bg-rose-500/15 text-rose-200' : 'bg-white/[0.03] text-slate-400'}`}>
                    {d + 1}
                    {mark && <span className={`absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full ${mark}`} />}
                  </div>
                );
              })}
            </div>
          </Bento>

          <Bento className="md:col-span-2" delay={160} icon={Smartphone} title="Terasa seperti aplikasi" desc="Dipasang ke layar utama HP — ikon & nama lembaga Anda, tanpa Play Store.">
            <div className="flex justify-center gap-3">
              {[
                ['BK', '#3b82f6', 'Bimbel Kamu'],
                ['BB', '#10b981', 'Bimbel B…'],
                ['HM', '#ec4899', 'Harmoni'],
              ].map(([s, c, n]) => (
                <div key={s} className="flex flex-col items-center gap-1.5">
                  <span className="flex size-14 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${c}, ${c}99)` }}>
                    {s}
                  </span>
                  <span className="text-[10px] text-slate-400">{n}</span>
                </div>
              ))}
            </div>
          </Bento>

          <Bento className="md:col-span-3" delay={0} icon={UserPlus} title="Pendaftaran siswa online" desc="Calon siswa mendaftar dari website. Admin meninjau dan menerima, lalu akun orang tua & pelajar dibuat otomatis.">
            <div className="flex items-center gap-2 text-xs">
              {['Isi formulir', 'Dihubungi', 'Diterima', 'Mulai belajar'].map((t, i) => (
                <div key={t} className="flex flex-1 items-center gap-2">
                  <div className={`flex-1 rounded-xl px-2 py-2.5 text-center ring-1 ${i === 2 ? 'bg-violet-500/20 text-white ring-violet-400/40' : 'bg-[#0b0f22] text-slate-400 ring-white/8'}`}>{t}</div>
                  {i < 3 && <ArrowRight className="size-3.5 shrink-0 text-slate-600" />}
                </div>
              ))}
            </div>
          </Bento>

          <Bento className="md:col-span-3" delay={80} icon={Layers} title="Multi-cabang & hak akses" desc="Super Admin melihat semua cabang. Admin, pengajar, dan keuangan terkunci di cabangnya masing-masing.">
            <div className="flex flex-wrap gap-2">
              {['Super Admin', 'Admin cabang', 'Pengajar', 'Keuangan', 'Orang tua', 'Pelajar'].map((t, i) => (
                <span key={t} className={`rounded-full px-3 py-1.5 text-xs ring-1 ${i === 0 ? 'bg-gradient-to-r from-violet-500/30 to-cyan-400/20 text-white ring-violet-400/40' : 'bg-white/[0.03] text-slate-300 ring-white/10'}`}>
                  {t}
                </span>
              ))}
            </div>
          </Bento>
        </div>

        <Reveal className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [Bell, 'Push notifikasi', 'Ke orang tua satu cabang, satu kelas, atau orang tertentu.'],
            [Newspaper, 'Blog & vlog', 'Cerita kegiatan, video YouTube, per cabang.'],
            [Palette, 'Mading karya siswa', 'Siswa menempel karya; admin memoderasi.'],
            [Camera, 'Foto & video', 'Lampiran kegiatan kelas untuk orang tua.'],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof Bell;
            return (
              <div key={t as string} className="flex gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                <I className="mt-0.5 size-5 shrink-0 text-cyan-300" />
                <div>
                  <div className="text-sm font-semibold text-white">{t as string}</div>
                  <div className="mt-0.5 text-xs leading-relaxed text-slate-400">{d as string}</div>
                </div>
              </div>
            );
          })}
        </Reveal>
      </section>

      {/* ================= WHITE-LABEL ================= */}
      <section id="merek" className="scroll-mt-20 relative py-24 sm:py-32">
        <div aria-hidden className="absolute inset-x-0 top-1/2 h-96 -translate-y-1/2 bg-gradient-to-r from-violet-600/10 via-transparent to-cyan-500/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-8 lg:grid-cols-2">
          <div>
            <Reveal>
              <h2 className="text-3xl leading-tight font-extrabold tracking-tight text-white sm:text-5xl">
                Merek Anda di depan. <span className="nf-text-gradient">Kami di belakang layar.</span>
              </h2>
              <p className="mt-5 text-base text-slate-400 sm:text-lg">
                Orang tua dan siswa mengenal lembaga Anda, bukan software-nya. Semua halaman, notifikasi, hingga rapor tampil atas nama Anda.
              </p>
            </Reveal>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                [Globe2, 'Domain sendiri', 'belajar.namalembaga.com atau subdomain gratis, lengkap HTTPS.'],
                [Palette, 'Logo & warna', 'Diatur sendiri lewat menu Identitas Lembaga, berlaku seketika.'],
                [Smartphone, 'Ikon aplikasi', 'Nama & ikon lembaga di layar utama HP orang tua.'],
                [FileBadge, 'Kop rapor', 'Rapor dan gambar preview saat link dibagikan, atas nama lembaga.'],
              ].map(([Icon, t, d], i) => {
                const I = Icon as typeof Globe2;
                return (
                  <Reveal key={t as string} delay={i * 70} className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
                    <I className="size-5 text-violet-300" />
                    <div className="mt-3 font-semibold text-white">{t as string}</div>
                    <div className="mt-1 text-sm text-slate-400">{d as string}</div>
                  </Reveal>
                );
              })}
            </div>
          </div>

          {/* Visual: website klien di domain sendiri + ikon aplikasi + kop rapor */}
          <Reveal delay={150} className="relative mx-auto w-full max-w-md">
            <div className="nf-border-glow overflow-hidden rounded-3xl">
              <div className="flex items-center gap-2 border-b border-white/8 bg-white/[0.03] px-4 py-2.5">
                <span className="size-2.5 rounded-full bg-rose-400/70" />
                <span className="size-2.5 rounded-full bg-amber-300/70" />
                <span className="size-2.5 rounded-full bg-emerald-400/70" />
                <div className="mx-auto flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 font-mono text-[11px] text-slate-300">
                  <Lock className="size-3 text-emerald-300" /> bimbelkamu.com
                </div>
              </div>
              <div className="relative h-56 bg-gradient-to-br from-[#3b82f6] via-[#1e3a8a] to-[#070a18] p-5">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-full bg-[#3b82f6] text-[10px] font-bold text-white ring-2 ring-white/30">BK</span>
                  <span className="text-[10px] font-semibold tracking-[0.3em] text-white/90 uppercase">Bimbel Kamu</span>
                </div>
                <div className="absolute top-16 left-5">
                  <p className="text-xs font-medium text-sky-200">Berani bicara, siap juara</p>
                  <p className="mt-1 font-condensed text-4xl leading-[0.92] font-semibold text-white uppercase">
                    Bimbel
                    <br />
                    Kamu
                  </p>
                </div>
                {/* Ikon aplikasi di layar utama HP */}
                <div className="nf-float absolute top-14 right-5 flex flex-col items-center gap-1.5 rounded-2xl bg-black/30 p-3 backdrop-blur">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#60a5fa] to-[#1d4ed8] text-sm font-bold text-white shadow-lg">BK</span>
                  <span className="text-[10px] text-white/80">Bimbel Kamu</span>
                </div>
              </div>
            </div>
            <div className="nf-float-delay absolute -bottom-10 -left-4 w-56 rounded-2xl border border-white/10 bg-white p-3.5 text-slate-800 shadow-2xl sm:-left-10">
              <div className="flex items-center gap-2 border-b-2 border-[#1e3a8a] pb-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-[#3b82f6] text-[9px] font-bold text-white">BK</span>
                <div>
                  <div className="text-[8px] font-semibold tracking-widest text-[#3b82f6] uppercase">Rapor · Bimbel Kamu</div>
                  <div className="text-[11px] font-bold">Laporan Perkembangan</div>
                </div>
                <span className="ml-auto text-xl font-extrabold text-[#1e3a8a]">A</span>
              </div>
              <div className="mt-2 space-y-1">
                {[90, 78, 86].map((v, i) => (
                  <div key={i} className="h-1.5 rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-[#3b82f6]" style={{ width: `${v}%` }} />
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= PERAN ================= */}
      <section id="peran" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-24 sm:px-8 sm:py-32">
        <SectionHead eyebrow="Untuk siapa" title="Satu sistem, nyaman untuk semua orang" desc="Setiap peran mendapat portalnya sendiri — di komputer maupun HP." />
        <div className="mt-12">
          <RoleTabs />
        </div>
      </section>

      {/* ================= CARA KERJA ================= */}
      <section id="cara-kerja" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-24 sm:px-8 sm:py-32">
        <SectionHead eyebrow="Cara kerja" title="Mulai dalam tiga langkah" />
        <div className="relative mt-14 grid gap-6 md:grid-cols-3">
          <div aria-hidden className="absolute top-8 right-[16%] left-[16%] hidden h-px bg-gradient-to-r from-violet-500/0 via-violet-400/60 to-cyan-400/0 md:block" />
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 120} className="relative text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 text-xl font-extrabold text-white shadow-[0_10px_40px_-10px_rgba(139,92,246,0.9)]">
                {i + 1}
              </div>
              <h3 className="mt-6 text-lg font-bold text-white">{s.title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm text-slate-400">{s.desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= KEAMANAN ================= */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-8 sm:pb-32">
        <Reveal className="grid gap-6 rounded-3xl border border-white/8 bg-gradient-to-br from-white/[0.04] to-transparent p-7 sm:p-10 lg:grid-cols-[1fr_1.4fr] lg:items-center">
          <div>
            <ShieldCheck className="size-10 text-cyan-300" />
            <h2 className="mt-4 text-2xl font-extrabold text-white sm:text-3xl">Data siswa aman & terpisah</h2>
            <p className="mt-2 text-slate-400">Data anak adalah amanah. Sistem dirancang agar setiap lembaga dan setiap cabang hanya melihat datanya sendiri.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              [Building2, 'Terisolasi per lembaga', 'Akun, data, dan file tidak bercampur.'],
              [Users, 'Akses sesuai peran', 'Dibatasi per peran & cabang di server.'],
              [Lock, 'HTTPS & password terenkripsi', 'Koneksi aman, password tidak tersimpan polos.'],
              [Layers, 'Backup harian', 'Database & file unggahan dicadangkan otomatis.'],
            ].map(([Icon, t, d]) => {
              const I = Icon as typeof Lock;
              return (
                <div key={t as string} className="flex gap-3 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/8">
                  <I className="mt-0.5 size-5 shrink-0 text-violet-300" />
                  <div>
                    <div className="text-sm font-semibold text-white">{t as string}</div>
                    <div className="text-xs text-slate-400">{d as string}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </section>

      {/* ================= FAQ ================= */}
      <section id="faq" className="scroll-mt-20 mx-auto max-w-3xl px-4 pb-24 sm:px-8 sm:pb-32">
        <SectionHead eyebrow="FAQ" title="Pertanyaan yang sering diajukan" />
        <div className="mt-12 space-y-3">
          {FAQ.map(([q, a], i) => (
            <Reveal key={q} delay={i * 40}>
              <details className="group rounded-2xl border border-white/8 bg-white/[0.025] px-5 py-4 open:border-violet-400/30 open:bg-white/[0.04]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-white [&::-webkit-details-marker]:hidden">
                  {q}
                  <ChevronDown className="size-5 shrink-0 text-slate-400 transition group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= DEMO ================= */}
      <section id="demo" className="scroll-mt-20 relative px-4 pb-24 sm:px-8 sm:pb-32">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0c1c]">
          <div aria-hidden className="nf-glow absolute -top-40 -left-20 size-[480px] rounded-full bg-violet-600/30 blur-[110px]" />
          <div aria-hidden className="absolute -right-20 -bottom-40 size-[420px] rounded-full bg-cyan-500/20 blur-[110px]" />
          <div className="relative grid gap-10 p-7 sm:p-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <h2 className="text-3xl leading-tight font-extrabold tracking-tight text-white sm:text-5xl">
                Siap punya sistem <span className="nf-text-gradient">atas nama sendiri?</span>
              </h2>
              <p className="mt-4 text-slate-400">Isi form, kami hubungi lewat WhatsApp untuk menjadwalkan demo dan menyiapkan contoh lembaga Anda.</p>
              <ul className="mt-8 space-y-3 text-sm text-slate-300">
                {['Demo langsung dengan contoh data', 'Penawaran sesuai jumlah siswa & cabang', 'Bantuan pengisian data di awal'].map((t) => (
                  <li key={t} className="flex items-center gap-3">
                    <Check className="size-4 text-cyan-300" /> {t}
                  </li>
                ))}
              </ul>
              {(wa || org.email) && (
                <div className="mt-8 flex flex-wrap gap-3">
                  {wa && (
                    <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-2 text-sm text-emerald-200 ring-1 ring-emerald-400/30 hover:bg-emerald-500/25">
                      <MessageCircle className="size-4" /> WhatsApp
                    </a>
                  )}
                  {org.email && (
                    <a href={`mailto:${org.email}`} className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-slate-200 ring-1 ring-white/10 hover:bg-white/10">
                      <Mail className="size-4" /> {org.email}
                    </a>
                  )}
                </div>
              )}
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur sm:p-7">
              <DemoForm />
            </div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-white/8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <div className="flex items-center gap-2.5">
              <NofosysMark size={30} />
              <span className="text-lg font-extrabold text-white">{org.name}</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">Sistem lembaga belajar, atas nama lembaga Anda.</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
            <a href="#fitur" className="hover:text-white">
              Fitur
            </a>
            <a href="#faq" className="hover:text-white">
              FAQ
            </a>
            <a href="#demo" className="hover:text-white">
              Minta demo
            </a>
            <Link href="/platform/masuk" className="hover:text-white">
              Panel pengelola
            </Link>
          </nav>
        </div>
        <p className="pb-[calc(2rem+env(safe-area-inset-bottom))] text-center text-xs text-slate-600">
          © {new Date().getFullYear()} {org.name}. Seluruh hak cipta dilindungi.
        </p>
      </footer>
    </div>
  );
}
