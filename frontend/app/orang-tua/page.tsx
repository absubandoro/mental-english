'use client';

import { GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { ProfileForm } from '@/components/ProfileForm';
import { Avatar, PageHeader } from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function OrtuProfil() {
  const { user } = useAuth();
  return (
    <>
      <PageHeader title="Profil Saya" desc="Kelola data diri dan kontak Anda." />
      <ProfileForm
        extra={
          <div className="card p-6">
            <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-white">
              <GraduationCap className="size-5 text-brand-300" /> Anak terdaftar
            </h3>
            {user?.children?.length ? (
              <ul className="space-y-2">
                {user.children.map((c) => (
                  <li key={c.id}>
                    <Link href={`/orang-tua/anak?anak=${c.id}`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-white/5">
                      <Avatar name={c.name} src={c.avatarUrl} size={32} />
                      <span className="text-sm text-slate-200">{c.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">Belum ada anak yang ditautkan. Hubungi admin cabang.</p>
            )}
          </div>
        }
      />
    </>
  );
}
