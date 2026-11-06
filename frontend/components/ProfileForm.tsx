'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ROLE_LABEL } from '@/lib/format';
import type { User } from '@/lib/types';
import { Avatar, Badge, Button, ErrorBox, Field, ImageField } from './ui';

/** "Profil Saya" — dipakai semua role */
export function ProfileForm({ extra }: { extra?: React.ReactNode }) {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    address: user?.address ?? '',
    birthDate: user?.birthDate ?? '',
    school: user?.school ?? '',
    avatarUrl: user?.avatarUrl ?? '',
    bio: user?.bio ?? '',
  });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (!user) return null;
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  const save = async (body: Record<string, string>) => {
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      setUser(await api<User>('/auth/me', { method: 'PATCH', body }));
      setMsg('Perubahan tersimpan');
      setPw({ currentPassword: '', newPassword: '' });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="space-y-6">
        <div className="card p-6 text-center">
          <div className="flex justify-center">
            <Avatar name={user.name} src={user.avatarUrl} size={96} />
          </div>
          <h2 className="mt-4 font-display text-xl font-bold text-white">{user.name}</h2>
          <p className="text-sm text-slate-400">{user.email}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Badge>{ROLE_LABEL[user.role]}</Badge>
            {user.branch && <Badge tone="navy">{user.branch.name}</Badge>}
          </div>
        </div>
        {extra}
      </div>

      <div className="space-y-6">
        <form
          className="card space-y-4 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            save(form);
          }}
        >
          <h3 className="font-display text-lg font-bold text-white">Data diri</h3>
          {msg && <div className="rounded-xl bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">{msg}</div>}
          <ErrorBox message={error} />
          <ImageField label="Foto profil" value={form.avatarUrl} onChange={(avatarUrl) => setForm({ ...form, avatarUrl })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama lengkap">
              <input className="input" required value={form.name} onChange={set('name')} />
            </Field>
            <Field label="No. WhatsApp">
              <input className="input" value={form.phone} onChange={set('phone')} />
            </Field>
            {user.role === 'STUDENT' && (
              <>
                <Field label="Tanggal lahir">
                  <input className="input" type="date" value={form.birthDate} onChange={set('birthDate')} />
                </Field>
                <Field label="Sekolah">
                  <input className="input" value={form.school} onChange={set('school')} />
                </Field>
              </>
            )}
          </div>
          <Field label="Alamat">
            <input className="input" value={form.address} onChange={set('address')} />
          </Field>
          <Field label="Tentang saya">
            <textarea className="input min-h-24" value={form.bio} onChange={set('bio')} />
          </Field>
          <Button type="submit" loading={busy}>
            Simpan profil
          </Button>
        </form>

        <form
          className="card space-y-4 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            save(pw);
          }}
        >
          <h3 className="font-display text-lg font-bold text-white">Ganti password</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Password saat ini">
              <input className="input" type="password" required autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
            </Field>
            <Field label="Password baru">
              <input className="input" type="password" required minLength={6} autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
            </Field>
          </div>
          <Button type="submit" variant="secondary" loading={busy}>
            Ubah password
          </Button>
        </form>
      </div>
    </div>
  );
}
