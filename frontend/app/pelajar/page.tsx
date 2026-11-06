'use client';

import { School } from 'lucide-react';
import { ProfileForm } from '@/components/ProfileForm';
import { PageHeader } from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function PelajarProfil() {
  const { user } = useAuth();
  return (
    <>
      <PageHeader title="Profil Saya" desc="Kelola data diri dan lihat kelas yang kamu ikuti." />
      <ProfileForm
        extra={
          <div className="card p-6">
            <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-white">
              <School className="size-5 text-brand-300" /> Kelas saya
            </h3>
            {user?.classes?.length ? (
              <ul className="space-y-3">
                {user.classes.map((c) => (
                  <li key={c.id} className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/5">
                    <div className="font-semibold text-white">{c.name}</div>
                    <div className="text-xs text-slate-400">{c.schedule ?? 'Jadwal belum diatur'}</div>
                    {c.teachers.length > 0 && <div className="mt-1 text-xs text-brand-200">Pengajar: {c.teachers.join(', ')}</div>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">Belum terdaftar di kelas manapun.</p>
            )}
            {user?.parent && (
              <p className="mt-4 border-t border-white/5 pt-4 text-sm text-slate-400">
                Orang tua: <span className="text-slate-200">{user.parent.name}</span>
              </p>
            )}
          </div>
        }
      />
    </>
  );
}
