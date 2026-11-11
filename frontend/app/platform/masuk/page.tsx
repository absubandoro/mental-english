'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BrandMark } from '@/components/Logo';
import { useOrg } from '@/components/OrgProvider';
import { Button, ErrorBox, Field } from '@/components/ui';
import { usePlatformAuth } from '@/lib/platform';

export default function PlatformLogin() {
  const { admin, login } = usePlatformAuth();
  const org = useOrg();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (admin) router.replace('/platform');
  }, [admin, router]);

  return (
    <main className="bg-mesh flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="card w-full max-w-sm p-7">
        <div className="mb-6 flex items-center gap-3">
          <BrandMark size={48} />
          <div>
            <h1 className="font-display text-2xl font-bold text-white">{org.name}</h1>
            <p className="text-sm text-slate-400">Panel pengelola platform</p>
          </div>
        </div>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            try {
              await login(form.email, form.password);
              router.replace('/platform');
            } catch (er) {
              setError((er as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <ErrorBox message={error} />
          <Field label="Email">
            <input className="input" type="email" required autoComplete="username" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Password">
            <input className="input" type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          <Button type="submit" loading={busy} className="w-full">
            Masuk
          </Button>
        </form>
      </div>
    </main>
  );
}
