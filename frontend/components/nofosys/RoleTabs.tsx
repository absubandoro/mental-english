'use client';

import { BookOpenCheck, Building2, Check, HeartHandshake, Wallet } from 'lucide-react';
import { useState } from 'react';

const ROLES = [
  {
    key: 'ortu',
    label: 'Orang tua',
    icon: HeartHandshake,
    title: 'Tenang, karena selalu tahu perkembangan anak',
    points: ['Absensi & nilai ujian langsung setelah kelas', 'Rapor perkembangan per aspek, bisa diunduh PDF', 'Tagihan SPP + unggah bukti transfer dari HP', 'Kalender kelas, libur, dan pengumuman cabang'],
    mock: [
      ['Kehadiran bulan ini', '11 / 12 pertemuan', 'emerald'],
      ['Nilai ujian terakhir', '88 · Unit 4 Test', 'violet'],
      ['SPP Desember', 'Menunggu verifikasi', 'amber'],
    ],
  },
  {
    key: 'guru',
    label: 'Pengajar',
    icon: BookOpenCheck,
    title: 'Fokus mengajar, administrasinya beres sendiri',
    points: ['Kelas Hari Ini otomatis dari jadwal mingguan', 'Absensi satu ketuk: Hadir, Izin, Sakit, Alpa', 'Nilai ujian, catatan, foto & video kegiatan', 'Rapor dengan rekap kehadiran & nilai otomatis'],
    mock: [
      ['Kids Explorer A', '16.00 · Ruang 1 · 8 siswa', 'violet'],
      ['Teens Speaking B', '18.30 · Ujian · 6 siswa', 'amber'],
      ['Rapor November', '5 draf siap diterbitkan', 'emerald'],
    ],
  },
  {
    key: 'admin',
    label: 'Admin cabang',
    icon: Building2,
    title: 'Seluruh cabang terkendali dari satu layar',
    points: ['Pendaftaran siswa online — terima, akun dibuat otomatis', 'Kelas, jadwal, pengajar, dan kalender cabang', 'Blog, vlog, mading karya siswa, push notifikasi', 'Setiap cabang terkunci pada datanya sendiri'],
    mock: [
      ['Pendaftaran baru', '3 calon siswa menunggu', 'violet'],
      ['Kelas aktif', '6 kelas · 3 pengajar', 'emerald'],
      ['Agenda', 'Libur nasional, 25 Des', 'amber'],
    ],
  },
  {
    key: 'keu',
    label: 'Keuangan',
    icon: Wallet,
    title: 'Tagihan jalan sendiri, uang masuk lebih cepat',
    points: ['Tagihan SPP dibuat otomatis di tanggal pilihan Anda', 'Nominal per cabang, bisa khusus per siswa', 'Pengingat H-3 & saat lewat jatuh tempo', 'Verifikasi bukti transfer: Terima atau Tolak + alasan'],
    mock: [
      ['Perlu verifikasi', '3 bukti transfer baru', 'amber'],
      ['Lunas bulan ini', 'Rp 5.400.000', 'emerald'],
      ['Belum bayar', '9 tagihan · pengingat terkirim', 'violet'],
    ],
  },
] as const;

const TONE = {
  emerald: 'bg-emerald-400/15 text-emerald-300',
  violet: 'bg-violet-400/15 text-violet-300',
  amber: 'bg-amber-400/15 text-amber-200',
};

export function RoleTabs() {
  const [k, setK] = useState(0);
  const r = ROLES[k];
  return (
    <div>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:justify-center sm:px-0">
        {ROLES.map((x, i) => (
          <button
            key={x.key}
            onClick={() => setK(i)}
            className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${
              i === k ? 'border-violet-400/50 bg-violet-500/15 text-white' : 'border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <x.icon className="size-4" /> {x.label}
          </button>
        ))}
      </div>
      <div key={r.key} className="animate-fade-in mt-10 grid items-center gap-10 lg:grid-cols-2">
        <div>
          <h3 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{r.title}</h3>
          <ul className="mt-6 space-y-3.5">
            {r.points.map((p) => (
              <li key={p} className="flex gap-3 text-slate-300">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400">
                  <Check className="size-3 text-white" />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="nf-border-glow rounded-3xl p-5 sm:p-6">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <r.icon className="size-4 text-violet-300" /> Portal {r.label.toLowerCase()}
          </div>
          <div className="mt-4 space-y-3">
            {r.mock.map(([a, b, t]) => (
              <div key={a} className="flex items-center gap-4 rounded-2xl bg-white/[0.035] px-4 py-3.5 ring-1 ring-white/5">
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${TONE[t]}`}>
                  <Check className="size-4" />
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white">{a}</div>
                  <div className="truncate text-xs text-slate-400">{b}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
