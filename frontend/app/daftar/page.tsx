'use client';

import { CheckCircle2, GraduationCap, UserRound } from 'lucide-react';
import { BrandMark } from '@/components/Logo';
import { useOrg } from '@/components/OrgProvider';
import Link from 'next/link';
import { useState } from 'react';
import { PublicTabBar } from '@/components/PublicTabBar';
import { Button, ErrorBox, Field } from '@/components/ui';
import { api } from '@/lib/api';
import { useBranches } from '@/lib/useBranches';

const PROGRAMS = ['Kids (6–9 tahun)', 'Junior (10–12 tahun)', 'Teens (13–17 tahun)', 'Adult / Umum', 'Belum tahu — mohon disarankan'];

const EMPTY = {
  branchId: '',
  studentName: '',
  studentBirthDate: '',
  studentSchool: '',
  program: '',
  studentEmail: '',
  parentName: '',
  parentPhone: '',
  parentEmail: '',
  password: '',
  notes: '',
  website: '',
};

/** Pendaftaran siswa baru — ditinjau admin cabang, lalu akun orang tua & pelajar dibuat otomatis */
export default function DaftarSiswa() {
  const { branches } = useBranches();
  const org = useOrg();
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <main className="bg-mesh min-h-dvh px-4 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-10 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="mb-6 inline-flex items-center gap-3">
          <BrandMark size={44} />
          <span className="font-condensed text-sm font-medium tracking-[0.3em] text-white uppercase">{org.name}</span>
        </Link>

        {done ? (
          <div className="card p-8 text-center">
            <CheckCircle2 className="mx-auto size-14 text-emerald-300" />
            <h1 className="mt-4 font-display text-2xl font-bold text-white">Pendaftaran terkirim!</h1>
            <p className="mt-2 text-slate-300">
              Terima kasih. Admin <b>{done}</b> akan menghubungi Anda melalui WhatsApp untuk jadwal kelas percobaan / tes penempatan.
            </p>
            <p className="mt-2 text-sm text-slate-400">Setelah pendaftaran diterima, Anda bisa masuk dengan email orang tua dan password yang tadi dibuat.</p>
            <div className="mt-6 flex justify-center gap-2">
              <Link href="/" className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5">
                Beranda
              </Link>
              <Link href="/login" className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-400">
                Ke halaman Masuk
              </Link>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm font-semibold tracking-[0.2em] text-brand-300 uppercase">Pendaftaran siswa baru</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-white sm:text-4xl">Daftar di {org.name}</h1>
            <p className="mt-2 text-slate-400">Isi data di bawah ini. Admin cabang akan menghubungi Anda, lalu akun orang tua & pelajar dibuat setelah pendaftaran diterima.</p>

            <form
              className="mt-8 space-y-6"
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setError(null);
                try {
                  const body = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== '')) as Record<string, string>;
                  const r = await api<{ ok: boolean; branch?: string }>('/enrollments', { method: 'POST', body });
                  setDone(r.branch ?? 'cabang');
                  window.scrollTo({ top: 0 });
                } catch (er) {
                  setError((er as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <ErrorBox message={error} />
              <section className="card space-y-4 p-5 sm:p-6">
                <h2 className="flex items-center gap-2 font-display text-lg font-bold text-white">
                  <GraduationCap className="size-5 text-brand-300" /> Data calon siswa
                </h2>
                <Field label="Nama lengkap siswa">
                  <input className="input" required minLength={2} value={form.studentName} onChange={set('studentName')} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Tanggal lahir">
                    <input className="input" type="date" value={form.studentBirthDate} onChange={set('studentBirthDate')} />
                  </Field>
                  <Field label="Sekolah">
                    <input className="input" value={form.studentSchool} onChange={set('studentSchool')} placeholder="mis. SD Negeri 1 Bekasi" />
                  </Field>
                  <Field label="Program yang diminati">
                    <select className="input" value={form.program} onChange={set('program')}>
                      <option value="">Pilih program</option>
                      {PROGRAMS.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Cabang">
                    <select className="input" required value={form.branchId} onChange={set('branchId')}>
                      <option value="">Pilih cabang</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Email siswa (opsional)" hint="Untuk login portal pelajar. Jika kosong, kami buatkan otomatis.">
                  <input className="input" type="email" value={form.studentEmail} onChange={set('studentEmail')} />
                </Field>
              </section>

              <section className="card space-y-4 p-5 sm:p-6">
                <h2 className="flex items-center gap-2 font-display text-lg font-bold text-white">
                  <UserRound className="size-5 text-brand-300" /> Data orang tua / wali
                </h2>
                <Field label="Nama orang tua / wali">
                  <input className="input" required minLength={2} value={form.parentName} onChange={set('parentName')} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="No. WhatsApp">
                    <input className="input" type="tel" required inputMode="tel" value={form.parentPhone} onChange={set('parentPhone')} placeholder="08xx-xxxx-xxxx" />
                  </Field>
                  <Field label="Email (untuk login)">
                    <input className="input" type="email" required value={form.parentEmail} onChange={set('parentEmail')} />
                  </Field>
                </div>
                <Field label="Buat password" hint="Minimal 6 karakter. Dipakai untuk akun orang tua & pelajar.">
                  <input className="input" type="password" required minLength={6} autoComplete="new-password" value={form.password} onChange={set('password')} />
                </Field>
                <Field label="Catatan (opsional)">
                  <textarea className="input min-h-20" value={form.notes} onChange={set('notes')} placeholder="mis. jadwal yang diinginkan, kebutuhan khusus anak" />
                </Field>
                {/* Jebakan bot — disembunyikan dari pengguna */}
                <input type="text" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} className="hidden" aria-hidden />
              </section>

              <Button type="submit" loading={busy} className="w-full py-3 text-base">
                Kirim pendaftaran
              </Button>
              <p className="text-center text-sm text-slate-400">
                Sudah terdaftar?{' '}
                <Link href="/login" className="text-brand-300 hover:underline">
                  Masuk
                </Link>
              </p>
            </form>
          </>
        )}
      </div>
      <PublicTabBar />
    </main>
  );
}
