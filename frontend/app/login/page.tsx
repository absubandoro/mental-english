'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthCard } from '@/components/AuthCard';
import { Button, ErrorBox, Field } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { ROLE_HOME } from '@/lib/format';
import { useBranches } from '@/lib/useBranches';

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const { branches } = useBranches();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', branchId: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) router.replace(ROLE_HOME[user.role]);
  }, [loading, user, router]);

  return (
    <AuthCard title="Masuk" desc="Selamat datang kembali di Mental English" footer={<>Belum punya akun? <Link href="/daftar" className="text-brand-300 hover:underline">Daftar</Link></>}>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            const me = await login(form.email, form.password, form.branchId);
            router.replace(ROLE_HOME[me.role]);
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <ErrorBox message={error} />
        <Field label="Email">
          <input className="input" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Password">
          <input className="input" type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <Field label="Cabang" hint="Wajib untuk Admin & Pengajar — hanya bisa masuk ke cabang masing-masing. Pelajar & orang tua boleh dikosongkan.">
          <select className="input" value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
            <option value="">— Pelajar / Orang tua —</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>
        <Button type="submit" loading={busy} className="w-full">
          Masuk
        </Button>
      </form>
    </AuthCard>
  );
}
