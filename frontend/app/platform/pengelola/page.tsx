'use client';

import { KeyRound, ShieldCheck, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Avatar, Badge, Button, ErrorBox, Field, Modal, PageHeader, Spinner } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { papi, usePlatformApi, usePlatformAuth, type PlatformAdmin } from '@/lib/platform';
import { Credentials } from '../parts';

export default function PlatformAdmins() {
  const { admin, setAdmin } = usePlatformAuth();
  const { data, loading, error, setData, reload } = usePlatformApi<PlatformAdmin[]>('/admins');
  const [adding, setAdding] = useState(false);
  const [person, setPerson] = useState({ name: '', email: '' });
  const [creds, setCreds] = useState<{ email: string; password: string } | null>(null);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    setErr(null);
    setMsg(null);
    try {
      await fn();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Pengelola & Akun"
        desc="Orang yang boleh masuk ke panel ini dan mengelola semua lembaga."
        action={
          <Button onClick={() => (setPerson({ name: '', email: '' }), setAdding(true))}>
            <UserPlus className="size-4" /> Pengelola baru
          </Button>
        }
      />
      <ErrorBox message={error || err} />
      {msg && <p className="mb-4 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 ring-1 ring-emerald-400/20">{msg}</p>}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="card p-2 sm:p-3">
          {loading && !data ? (
            <Spinner />
          ) : (
            <ul className="divide-y divide-white/5">
              {data?.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-3 py-3">
                  <Avatar name={a.name} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      {a.name} {a.id === admin?.id && <Badge tone="blue">Anda</Badge>} {!a.isActive && <Badge tone="red">Nonaktif</Badge>}
                    </div>
                    <div className="truncate text-xs text-slate-400">
                      {a.email} · {a.lastLoginAt ? `terakhir masuk ${formatDate(a.lastLoginAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : 'belum pernah masuk'}
                    </div>
                  </div>
                  {a.id !== admin?.id && (
                    <Button
                      variant={a.isActive ? 'ghost' : 'secondary'}
                      size="sm"
                      loading={busy === a.id}
                      onClick={() => run(a.id, async () => setData(await papi<PlatformAdmin[]>(`/admins/${a.id}`, { method: 'PATCH', body: { isActive: !a.isActive } })))}
                    >
                      {a.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card space-y-4 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-white">
            <KeyRound className="size-5 text-brand-300" /> Ganti password saya
          </h2>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              run('pw', async () => {
                setAdmin(await papi<PlatformAdmin>('/auth/me', { method: 'PATCH', body: pw }));
                setPw({ currentPassword: '', newPassword: '' });
                setMsg('Password berhasil diganti.');
              });
            }}
          >
            <Field label="Password saat ini">
              <input className="input" type="password" required autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
            </Field>
            <Field label="Password baru" hint="Minimal 8 karakter">
              <input className="input" type="password" required minLength={8} autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
            </Field>
            <Button type="submit" loading={busy === 'pw'}>
              <ShieldCheck className="size-4" /> Simpan password
            </Button>
          </form>
        </section>
      </div>

      <Modal open={adding} onClose={() => (setAdding(false), setCreds(null))} title={creds ? 'Pengelola dibuat' : 'Pengelola baru'}>
        {creds ? (
          <div className="space-y-4">
            <Credentials title="Kirimkan data masuk ini ke pengelola baru." email={creds.email} password={creds.password} />
            <Button variant="secondary" className="w-full" onClick={() => (setAdding(false), setCreds(null))}>
              Selesai
            </Button>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              run('add', async () => {
                setCreds(await papi<{ email: string; password: string }>('/admins', { method: 'POST', body: person }));
                reload();
              });
            }}
          >
            <Field label="Nama">
              <input className="input" required minLength={2} value={person.name} onChange={(e) => setPerson({ ...person, name: e.target.value })} />
            </Field>
            <Field label="Email">
              <input className="input" type="email" required value={person.email} onChange={(e) => setPerson({ ...person, email: e.target.value })} />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setAdding(false)}>
                Batal
              </Button>
              <Button type="submit" loading={busy === 'add'}>
                Buat akun
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
