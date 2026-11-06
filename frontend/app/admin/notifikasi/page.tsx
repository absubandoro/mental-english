'use client';

import { Megaphone, Send } from 'lucide-react';
import { useState } from 'react';
import { BranchNotice, MultiPick, useBranchScope } from '@/components/admin';
import { Button, ErrorBox, Field, PageHeader, Pagination, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { useApi } from '@/lib/hooks';
import type { ClassRoom, NotificationTarget, Paged, User } from '@/lib/types';

interface Sent {
  id: string;
  title: string;
  body: string;
  target: NotificationTarget;
  createdAt: string;
  createdBy: { name: string } | null;
  recipientCount: number;
  readCount: number;
}

const TARGETS: { value: NotificationTarget; label: string; desc: string }[] = [
  { value: 'BRANCH_PARENTS', label: 'Semua orang tua', desc: 'Seluruh orang tua di cabang' },
  { value: 'CLASS_PARENTS', label: 'Orang tua per kelas', desc: 'Orang tua pelajar di satu kelas' },
  { value: 'USERS', label: 'Pilih penerima', desc: 'Orang tua tertentu' },
];
const TARGET_LABEL = Object.fromEntries(TARGETS.map((t) => [t.value, t.label])) as Record<NotificationTarget, string>;

export default function PushNotif() {
  const scope = useBranchScope();
  const [page, setPage] = useState(1);
  const { data, loading, reload } = useApi<Paged<Sent>>('/admin/notifications', { page, branchId: scope.branchId });
  const { data: classes } = useApi<ClassRoom[]>('/admin/classes', { branchId: scope.branchId });
  const { data: parents } = useApi<Paged<User>>('/admin/users', { role: 'PARENT', limit: 100, branchId: scope.branchId });
  const [form, setForm] = useState({ title: '', body: '', target: 'BRANCH_PARENTS' as NotificationTarget, classId: '', userIds: [] as string[] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <>
      <PageHeader title="Push Notifikasi" desc="Kirim pengumuman ke orang tua. Notifikasi muncul di menu Notifikasi orang tua." />
      <BranchNotice />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <form
          className="card h-fit space-y-4 p-6"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            setMsg(null);
            try {
              const res = await api<{ recipientCount: number }>('/admin/notifications', {
                method: 'POST',
                body: {
                  title: form.title,
                  body: form.body,
                  target: form.target,
                  branchId: scope.branchId,
                  classId: form.target === 'CLASS_PARENTS' ? form.classId : undefined,
                  userIds: form.target === 'USERS' ? form.userIds : undefined,
                },
              });
              setMsg(`Terkirim ke ${res.recipientCount} penerima.`);
              setForm({ ...form, title: '', body: '' });
              reload();
            } catch (er) {
              setError((er as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {msg && <div className="rounded-xl bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">{msg}</div>}
          <ErrorBox message={error} />
          <div>
            <span className="label">Kirim ke</span>
            <div className="grid gap-2 sm:grid-cols-3">
              {TARGETS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm({ ...form, target: t.value })}
                  className={`rounded-xl border p-3 text-left transition ${form.target === t.value ? 'border-brand-400 bg-brand-500/15' : 'border-white/10 hover:bg-white/5'}`}
                >
                  <div className="text-sm font-semibold text-white">{t.label}</div>
                  <div className="text-xs text-slate-400">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>
          {form.target === 'CLASS_PARENTS' && (
            <Field label="Kelas">
              <select className="input" required value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
                <option value="">Pilih kelas</option>
                {classes?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.students.length} pelajar)
                  </option>
                ))}
              </select>
            </Field>
          )}
          {form.target === 'USERS' && <MultiPick label="Orang tua" options={parents?.data ?? []} value={form.userIds} onChange={(userIds) => setForm({ ...form, userIds })} />}
          <Field label="Judul">
            <input className="input" required minLength={3} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Pesan">
            <textarea className="input min-h-32" required minLength={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          </Field>
          <Button type="submit" loading={busy} disabled={scope.needBranch} className="w-full">
            <Send className="size-4" /> Kirim notifikasi
          </Button>
        </form>

        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-white">Riwayat terkirim</h2>
          {loading && !data ? (
            <Spinner />
          ) : !data?.data.length ? (
            <div className="card flex flex-col items-center p-10 text-center text-sm text-slate-400">
              <Megaphone className="mb-2 size-8 text-brand-300" /> Belum ada notifikasi terkirim.
            </div>
          ) : (
            <ul className="space-y-3">
              {data.data.map((n) => (
                <li key={n.id} className="card p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-semibold text-white">{n.title}</h3>
                    <time className="text-xs text-slate-500">{formatDate(n.createdAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</time>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-400">{n.body}</p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>{TARGET_LABEL[n.target]}</span>
                    <span>
                      Dibaca {n.readCount}/{n.recipientCount}
                    </span>
                    {n.createdBy && <span>oleh {n.createdBy.name}</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {data && <Pagination page={data.page} total={data.total} limit={data.limit} onChange={setPage} />}
        </section>
      </div>
    </>
  );
}
