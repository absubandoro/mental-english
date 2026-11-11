'use client';

import { CheckCircle2, Send } from 'lucide-react';
import { useState } from 'react';
import { API_URL, tenantHeader } from '@/lib/api';

const EMPTY = { name: '', institution: '', phone: '', email: '', city: '', size: '', message: '', website: '' };
const SIZES = ['< 50 siswa', '50–150 siswa', '150–500 siswa', '> 500 siswa'];

/** Form "Minta demo" — masuk ke menu Permintaan Demo di panel pengelola */
export function DemoForm() {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });
  const input =
    'w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-violet-400/60 focus:bg-white/[0.06] focus:ring-4 focus:ring-violet-500/10';

  if (done) {
    return (
      <div className="flex h-full flex-col items-center justify-center py-10 text-center">
        <CheckCircle2 className="size-14 text-emerald-300" />
        <h3 className="mt-4 text-2xl font-extrabold text-white">Terima kasih, {form.name.split(' ')[0]}!</h3>
        <p className="mt-2 max-w-sm text-slate-400">Permintaan demo untuk {form.institution} sudah kami terima. Tim kami akan menghubungi Anda lewat WhatsApp.</p>
      </div>
    );
  }

  return (
    <form
      className="grid gap-3.5 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          const res = await fetch(`${API_URL}/platform/leads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...tenantHeader() },
            body: JSON.stringify(form),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message || 'Gagal mengirim');
          setDone(true);
        } catch (er) {
          setError((er as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      {error && <p className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-200 ring-1 ring-rose-400/20 sm:col-span-2">{error}</p>}
      <input className={input} placeholder="Nama Anda" required minLength={2} value={form.name} onChange={set('name')} autoComplete="name" />
      <input className={input} placeholder="Nama lembaga" required minLength={2} value={form.institution} onChange={set('institution')} />
      <input className={input} placeholder="No. WhatsApp" required inputMode="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" />
      <input className={input} placeholder="Email (opsional)" type="email" value={form.email} onChange={set('email')} autoComplete="email" />
      <input className={input} placeholder="Kota" value={form.city} onChange={set('city')} />
      <select className={`${input} ${form.size ? '' : 'text-slate-500'}`} value={form.size} onChange={set('size')}>
        <option value="">Jumlah siswa</option>
        {SIZES.map((s) => (
          <option key={s} value={s} className="text-ink-950">
            {s}
          </option>
        ))}
      </select>
      <textarea className={`${input} min-h-24 sm:col-span-2`} placeholder="Ceritakan lembaga Anda (opsional): jenis kursus, jumlah cabang, kebutuhan…" value={form.message} onChange={set('message')} />
      {/* jebakan bot */}
      <input type="text" tabIndex={-1} autoComplete="off" className="hidden" value={form.website} onChange={set('website')} aria-hidden />
      <button
        type="submit"
        disabled={busy}
        className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:brightness-110 disabled:opacity-60 sm:col-span-2"
      >
        <Send className="size-4" /> {busy ? 'Mengirim…' : 'Kirim permintaan demo'}
      </button>
      <p className="text-center text-xs text-slate-500 sm:col-span-2">Gratis, tanpa kewajiban. Kami hanya menghubungi Anda terkait demo.</p>
    </form>
  );
}
