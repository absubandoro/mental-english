'use client';

import { CalendarClock, Pencil, Plus, School, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { BranchNotice, MultiPick, SearchInput, useBranchScope } from '@/components/admin';
import { Avatar, Badge, Button, confirmDelete, Empty, ErrorBox, Field, Modal, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { useApi, useDebounced } from '@/lib/hooks';
import type { ClassRoom, Paged, User } from '@/lib/types';

const EMPTY = { name: '', schedule: '', level: '', description: '', studentIds: [] as string[], teacherIds: [] as string[] };

export default function AdminKelas() {
  const scope = useBranchScope();
  const [q, setQ] = useState('');
  const dq = useDebounced(q);
  const { data, loading, reload } = useApi<ClassRoom[]>('/admin/classes', { q: dq, branchId: scope.branchId });
  const { data: students } = useApi<Paged<User>>('/admin/users', { role: 'STUDENT', limit: 100, branchId: scope.branchId });
  const { data: teachers } = useApi<Paged<User>>('/admin/users', { role: 'TEACHER', limit: 100, branchId: scope.branchId });
  const [editing, setEditing] = useState<ClassRoom | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openForm = (c?: ClassRoom) => {
    setEditing(c ?? null);
    setError(null);
    setForm(
      c
        ? { name: c.name, schedule: c.schedule ?? '', level: c.level ?? '', description: c.description ?? '', studentIds: c.students.map((s) => s.id), teacherIds: c.teachers.map((t) => t.id) }
        : EMPTY,
    );
    setOpen(true);
  };

  const branchOf = (u: User) => !editing || u.branchId === editing.branchId;

  return (
    <>
      <PageHeader
        title="Kelas"
        desc="Buat kelas, tentukan pelajar dan pengajarnya."
        action={
          <Button onClick={() => openForm()} disabled={scope.needBranch}>
            <Plus className="size-4" /> Kelas baru
          </Button>
        }
      />
      <BranchNotice />
      <div className="mb-4 max-w-md">
        <SearchInput value={q} onChange={setQ} placeholder="Cari nama kelas…" />
      </div>
      {loading && !data ? (
        <Spinner />
      ) : !data?.length ? (
        <Empty icon={<School className="size-8" />} title="Belum ada kelas" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((c) => (
            <div key={c.id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-display text-lg font-bold text-white">{c.name}</h2>
                  {scope.isSuper && <p className="text-xs text-slate-500">{c.branch?.name}</p>}
                </div>
                {c.level && <Badge tone="navy">{c.level}</Badge>}
              </div>
              <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                <CalendarClock className="size-4" /> {c.schedule || 'Jadwal belum diatur'}
              </p>
              <p className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                <Users className="size-4" /> {c.students.length} pelajar · {c.teachers.length} pengajar
              </p>
              <div className="mt-3 flex -space-x-2">
                {c.students.slice(0, 7).map((s) => (
                  <Avatar key={s.id} name={s.name} src={s.avatarUrl} size={28} />
                ))}
                {c.students.length > 7 && <span className="flex size-7 items-center justify-center rounded-full bg-ink-700 text-[10px] text-white ring-2 ring-white/10">+{c.students.length - 7}</span>}
              </div>
              <p className="mt-3 text-xs text-slate-500">Pengajar: {c.teachers.map((t) => t.name).join(', ') || '—'}</p>
              <div className="mt-auto flex justify-end gap-1 pt-4">
                <Button variant="secondary" size="sm" onClick={() => openForm(c)}>
                  <Pencil className="size-3.5" /> Ubah
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Hapus"
                  onClick={async () => {
                    if (!confirmDelete(`kelas ${c.name} beserta riwayat pertemuannya`)) return;
                    await api(`/admin/classes/${c.id}`, { method: 'DELETE' });
                    reload();
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Ubah kelas' : 'Kelas baru'} wide>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            try {
              await api(editing ? `/admin/classes/${editing.id}` : '/admin/classes', {
                method: editing ? 'PATCH' : 'POST',
                body: { ...form, ...(editing ? {} : { branchId: scope.branchId }) },
              });
              setOpen(false);
              reload();
            } catch (er) {
              setError((er as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <ErrorBox message={error} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Nama kelas">
              <input className="input" required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Jadwal">
              <input className="input" placeholder="Senin & Rabu, 15.30" value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} />
            </Field>
            <Field label="Level">
              <input className="input" placeholder="Kids / Teens" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} />
            </Field>
          </div>
          <Field label="Deskripsi">
            <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <MultiPick label="Pelajar" options={(students?.data ?? []).filter(branchOf)} value={form.studentIds} onChange={(studentIds) => setForm({ ...form, studentIds })} />
            <MultiPick label="Pengajar" options={(teachers?.data ?? []).filter(branchOf)} value={form.teacherIds} onChange={(teacherIds) => setForm({ ...form, teacherIds })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={busy}>
              Simpan
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
