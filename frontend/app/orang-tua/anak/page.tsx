'use client';

import { Suspense } from 'react';
import { WithChild } from '@/components/ChildPicker';
import { Avatar, Badge, PageHeader, Spinner } from '@/components/ui';
import { formatDate } from '@/lib/format';

export default function ProfilAnak() {
  return (
    <>
      <PageHeader title="Profil Anak" desc="Data diri dan kelas yang diikuti anak Anda." />
      <Suspense fallback={<Spinner />}>
        <WithChild>
          {(c) => (
            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
              <div className="card p-6 text-center">
                <div className="flex justify-center">
                  <Avatar name={c.name} src={c.avatarUrl} size={96} />
                </div>
                <h2 className="mt-4 font-display text-xl font-bold text-white">{c.name}</h2>
                <p className="text-sm text-slate-400">{c.email}</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {c.level && <Badge>{c.level}</Badge>}
                  {c.branch && <Badge tone="navy">{c.branch.name}</Badge>}
                </div>
                {c.bio && <p className="mt-4 text-sm text-slate-300">{c.bio}</p>}
              </div>
              <div className="space-y-6">
                <div className="card p-6">
                  <h3 className="mb-4 font-display text-lg font-bold text-white">Data diri</h3>
                  <dl className="grid gap-4 text-sm sm:grid-cols-2">
                    {[
                      ['Tanggal lahir', formatDate(c.birthDate)],
                      ['Sekolah', c.school ?? '-'],
                      ['No. WhatsApp', c.phone ?? '-'],
                      ['Alamat', c.address ?? '-'],
                      ['Terdaftar sejak', formatDate(c.createdAt)],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-xs text-slate-500">{k}</dt>
                        <dd className="mt-0.5 text-slate-200">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div className="card p-6">
                  <h3 className="mb-4 font-display text-lg font-bold text-white">Kelas</h3>
                  {c.classes?.length ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {c.classes.map((k) => (
                        <div key={k.id} className="rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/5">
                          <div className="font-semibold text-white">{k.name}</div>
                          <div className="text-xs text-slate-400">{k.schedule ?? 'Jadwal belum diatur'}</div>
                          {k.teachers.length > 0 && <div className="mt-2 text-xs text-brand-200">Pengajar: {k.teachers.join(', ')}</div>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">Belum terdaftar di kelas.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </WithChild>
      </Suspense>
    </>
  );
}
