'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthCard } from '@/components/AuthCard';
import { Button, ErrorBox, Field } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { ROLE_HOME } from '@/lib/format';
import { useBranches } from '@/lib/useBranches';

export default function DaftarPage() {
  const { register } = useAuth();
  const { branches } = useBranches();
  const router = useRouter();
  const [form, setForm] = useState({ role: 'PARENT', name: '', email: '', phone: '', password: '', branchId: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <AuthCard title="Daftar" desc="Buat akun Mental English" footer={<>Sudah punya akun? <Link href="/login" className="text-brand-300 hover:underline">Masuk</Link></>}>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            const me = await register(form);
            router.replace(ROLE_HOME[me.role]);
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <ErrorBox message={error} />
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-ink-900 p-1">
          {[
            ['PARENT', 'Orang Tua'],
            ['STUDENT', 'Pelajar'],
          ].map(([v, l]) => (
            <button
              key={v}
              type="button"
              onClick={() => setForm({ ...form, role: v })}
              className={`rounded-lg py-2 text-sm font-medium transition ${form.role === v ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              {l}
            </button>
          ))}
        </div>
        <Field label="Nama lengkap">
          <input className="input" required minLength={2} value={form.name} onChange={set('name')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email">
            <input className="input" type="email" required value={form.email} onChange={set('email')} />
          </Field>
          <Field label="No. WhatsApp">
            <input className="input" value={form.phone} onChange={set('phone')} />
          </Field>
        </div>
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
        <Field label="Password" hint="Minimal 6 karakter">
          <input className="input" type="password" required minLength={6} autoComplete="new-password" value={form.password} onChange={set('password')} />
        </Field>
        {form.role === 'PARENT' && (
          <p className="rounded-xl bg-brand-500/10 px-3 py-2 text-xs text-brand-100">Setelah mendaftar, admin cabang akan menghubungkan akun Anda dengan data anak.</p>
        )}
        <Button type="submit" loading={busy} className="w-full">
          Buat akun
        </Button>
      </form>
    </AuthCard>
  );
}
