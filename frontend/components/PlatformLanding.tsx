import {
  ArrowRight, BadgeCheck, CalendarDays, CreditCard, FileBadge, Globe2, LayoutDashboard, Palette, ReceiptText, School, Smartphone, UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import type { Org } from '@/lib/org';
import { waLink } from '@/lib/org';
import { BrandMark } from './Logo';

const FEATURES = [
  { icon: Palette, title: 'Merek Anda sendiri', desc: 'Nama, logo, warna, foto, dan domain lembaga. Siswa & orang tua tidak melihat nama platform.' },
  { icon: Smartphone, title: 'Terasa seperti aplikasi', desc: 'Dipasang ke layar utama HP Android & iPhone, tanpa perlu Play Store.' },
  { icon: UserPlus, title: 'Pendaftaran online', desc: 'Calon siswa mendaftar dari website; admin menerima & akun dibuat otomatis.' },
  { icon: School, title: 'Kelas & absensi', desc: 'Jadwal mingguan, kelas hari ini, absensi, nilai ujian, foto & video kegiatan.' },
  { icon: FileBadge, title: 'Rapor perkembangan', desc: 'Rapor per aspek dengan rekap kehadiran & ujian otomatis, siap cetak PDF.' },
  { icon: ReceiptText, title: 'Tagihan otomatis', desc: 'SPP dibuat otomatis tiap bulan, lengkap dengan pengingat jatuh tempo.' },
  { icon: CreditCard, title: 'Verifikasi pembayaran', desc: 'Orang tua unggah bukti transfer, admin / keuangan menerima atau menolak.' },
  { icon: CalendarDays, title: 'Kalender cabang', desc: 'Agenda, libur, dan ujian yang tersinkron dengan jadwal setiap kelas.' },
];

const STEPS = [
  { title: 'Kami siapkan lembaga Anda', desc: 'Website & akun Super Admin aktif di subdomain dalam hitungan menit.' },
  { title: 'Atur identitas & cabang', desc: 'Unggah logo, pilih warna, isi cabang, kelas, pengajar, dan siswa.' },
  { title: 'Pakai di domain sendiri', desc: 'Hubungkan domain lembaga, bagikan ke orang tua — selesai.' },
];

/** Beranda di domain platform: website produk Nofosys */
export function PlatformLanding({ org }: { org: Org }) {
  const contact = org.whatsapp ? waLink(org.whatsapp, `Halo ${org.name}, saya tertarik memakai ${org.name} untuk lembaga saya.`) : org.email ? `mailto:${org.email}` : null;
  return (
    <main className="bg-mesh min-h-dvh">
      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        <header className="flex items-center justify-between pt-[calc(1.25rem+env(safe-area-inset-top))] sm:pt-6">
          <div className="flex items-center gap-2.5">
            <BrandMark size={38} />
            <span className="font-display text-xl font-bold text-white">{org.name}</span>
          </div>
          <Link href="/platform/masuk" className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5">
            <LayoutDashboard className="size-4" /> Panel pengelola
          </Link>
        </header>

        <section className="grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-500/15 px-3 py-1 text-xs font-semibold tracking-wider text-brand-200 uppercase ring-1 ring-brand-400/30">
              <BadgeCheck className="size-3.5" /> Untuk kursus, bimbel & les
            </span>
            <h1 className="mt-5 font-display text-4xl leading-tight font-extrabold text-white sm:text-6xl">
              Sistem lembaga belajar, <span className="text-brand-300">dengan merek Anda sendiri.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">{org.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {contact && (
                <a href={contact} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 hover:bg-brand-400">
                  Hubungi kami <ArrowRight className="size-4" />
                </a>
              )}
              <a href="#fitur" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/5">
                Lihat fitur
              </a>
            </div>
          </div>

          {/* Ilustrasi: satu platform, banyak merek */}
          <div className="relative mx-auto h-80 w-full max-w-md">
            {[
              { name: 'Kursus A', color: '#3d8ccf', cls: 'left-0 top-6 -rotate-6' },
              { name: 'Bimbel B', color: '#16a34a', cls: 'right-0 top-0 rotate-6' },
              { name: 'Les C', color: '#db2777', cls: 'left-1/2 top-24 -translate-x-1/2 rotate-1' },
            ].map((b) => (
              <div key={b.name} className={`absolute w-52 rounded-3xl border border-white/10 bg-ink-850 p-4 shadow-2xl shadow-black/50 ${b.cls}`}>
                <div className="flex items-center gap-2">
                  <span className="size-7 rounded-full" style={{ background: b.color }} />
                  <span className="text-sm font-semibold text-white">{b.name}</span>
                </div>
                <div className="mt-4 h-16 rounded-xl" style={{ background: `linear-gradient(135deg, ${b.color}, #24255a)` }} />
                <div className="mt-3 space-y-1.5">
                  <div className="h-2 w-3/4 rounded bg-white/15" />
                  <div className="h-2 w-1/2 rounded bg-white/10" />
                </div>
                <div className="mt-4 rounded-lg py-1.5 text-center text-[11px] font-semibold text-white" style={{ background: b.color }}>
                  Daftar sekarang
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="fitur" className="scroll-mt-6 py-10">
          <h2 className="font-display text-3xl font-bold text-white">Semua yang dibutuhkan lembaga belajar</h2>
          <p className="mt-2 text-slate-400">Satu sistem untuk pengunjung, pelajar, orang tua, pengajar, admin cabang, dan keuangan.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-5">
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold text-white">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-10">
          <h2 className="font-display text-3xl font-bold text-white">Mulai dalam tiga langkah</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="card p-6">
                <div className="font-display text-4xl font-extrabold text-brand-300">{String(i + 1).padStart(2, '0')}</div>
                <h3 className="mt-3 font-semibold text-white">{s.title}</h3>
                <p className="mt-1.5 text-sm text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="my-10 rounded-3xl bg-gradient-to-br from-brand-500/25 via-navy-600/30 to-ink-900 p-8 text-center ring-1 ring-white/10 sm:p-12">
          <Globe2 className="mx-auto size-10 text-brand-300" />
          <h2 className="mt-4 font-display text-3xl font-bold text-white">Siap punya sistem sendiri?</h2>
          <p className="mx-auto mt-2 max-w-lg text-slate-300">Website, aplikasi HP, rapor, dan tagihan otomatis — atas nama lembaga Anda.</p>
          {contact && (
            <a href={contact} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-400">
              Hubungi {org.name} <ArrowRight className="size-4" />
            </a>
          )}
        </section>

        <footer className="py-8 text-center text-xs text-slate-500">© {new Date().getFullYear()} {org.name}</footer>
      </div>
    </main>
  );
}
