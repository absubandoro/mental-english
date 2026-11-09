'use client';

import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { api } from '@/lib/api';
import { formatDate, ROLE_LABEL } from '@/lib/format';
import { useApi, useDebounced } from '@/lib/hooks';
import type { Paged, Role, User } from '@/lib/types';
import { useBranches } from '@/lib/useBranches';
import { BranchNotice, SearchInput, Table, td, useBranchScope } from './admin';
import { Avatar, Badge, Button, confirmDelete, Empty, ErrorBox, Field, Modal, PageHeader, Pagination, Spinner } from './ui';

const TITLES: Partial<Record<Role, { title: string; desc: string }>> = {
  STUDENT: { title: 'User Anak', desc: 'Kelola akun pelajar dan tautkan ke akun orang tua.' },
  PARENT: { title: 'User Orang Tua', desc: 'Kelola akun orang tua pelajar.' },
  TEACHER: { title: 'Pengajar', desc: 'Kelola akun pengajar cabang. Pengajar hanya bisa login ke cabangnya.' },
  ADMIN: { title: 'Admin Cabang', desc: 'Kelola akun admin untuk setiap cabang.' },
  FINANCE: { title: 'User Keuangan', desc: 'Akun bagian keuangan: kelola tagihan & verifikasi pembayaran. Hanya bisa login ke cabangnya.' },
};

type Form = Record<'name' | 'email' | 'password' | 'phone' | 'address' | 'birthDate' | 'school' | 'level' | 'parentId' | 'branchId' | 'monthlyFee', string> & { isActive: boolean };
const EMPTY: Form = { name: '', email: '', password: '', phone: '', address: '', birthDate: '', school: '', level: '', parentId: '', branchId: '', monthlyFee: '', isActive: true };

export function UsersManager({ role }: { role: Role }) {
  const scope = useBranchScope();
  const { branches } = useBranches();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  const { data, loading, reload } = useApi<Paged<User>>('/admin/users', { role, q: dq, page, branchId: scope.branchId });
  const { data: parents } = useApi<Paged<User>>(role === 'STUDENT' ? '/admin/users' : null, { role: 'PARENT', limit: 100, branchId: scope.branchId });
  const [editing, setEditing] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = TITLES[role]!;
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  const openForm = (u?: User) => {
    setEditing(u ?? null);
    setError(null);
    setForm(
      u
        ? {
            name: u.name,
            email: u.email,
            password: '',
            phone: u.phone ?? '',
            address: u.address ?? '',
            birthDate: u.birthDate ?? '',
            school: u.school ?? '',
            level: u.level ?? '',
            parentId: u.parentId ?? '',
            branchId: u.branchId ?? '',
            monthlyFee: u.monthlyFee != null ? String(u.monthlyFee) : '',
            isActive: u.isActive,
          }
        : { ...EMPTY, branchId: scope.branchId ?? '' },
    );
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const body: Record<string, unknown> = {
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      address: form.address || undefined,
      isActive: form.isActive,
      ...(form.password ? { password: form.password } : {}),
      ...(scope.isSuper && form.branchId ? { branchId: form.branchId } : {}),
    };
    if (role === 'STUDENT')
      Object.assign(body, {
        birthDate: form.birthDate || undefined,
        school: form.school || undefined,
        level: form.level || undefined,
        parentId: form.parentId || null,
        monthlyFee: form.monthlyFee === '' ? null : Number(form.monthlyFee),
      });
    try {
      if (editing) await api(`/admin/users/${editing.id}`, { method: 'PATCH', body });
      else await api('/admin/users', { method: 'POST', body: { ...body, role } });
      setOpen(false);
      reload();
    } catch (er) {
      setError((er as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title={t.title}
        desc={t.desc}
        action={
          <Button onClick={() => openForm()} disabled={scope.needBranch}>
            <Plus className="size-4" /> Tambah {ROLE_LABEL[role].toLowerCase()}
          </Button>
        }
      />
      <BranchNotice />
      <div className="mb-4 max-w-md">
        <SearchInput value={q} onChange={(v) => (setQ(v), setPage(1))} placeholder="Cari nama, email, atau no. HP…" />
      </div>
      {loading && !data ? (
        <Spinner />
      ) : !data?.data.length ? (
        <Empty icon={<Users className="size-8" />} title="Belum ada data" />
      ) : (
        <>
          <Table head={['Nama', 'Kontak', role === 'STUDENT' ? 'Orang tua' : role === 'PARENT' ? 'Anak' : 'Bergabung', 'Cabang', 'Status', '']}>
            {data.data.map((u) => (
              <tr key={u.id} className="hover:bg-white/[0.02]">
                <td className={td}>
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} src={u.avatarUrl} size={34} />
                    <div>
                      <div className="font-medium text-white">{u.name}</div>
                      {u.level && <div className="text-xs text-slate-500">{u.level}</div>}
                    </div>
                  </div>
                </td>
                <td className={`${td} text-slate-400`}>
                  <div>{u.email}</div>
                  <div className="text-xs">{u.phone}</div>
                </td>
                <td className={`${td} text-slate-300`}>
                  {role === 'STUDENT'
                    ? u.parent?.name ?? <span className="text-amber-300/80">Belum ditautkan</span>
                    : role === 'PARENT'
                      ? u.children?.map((c) => c.name).join(', ') || '-'
                      : formatDate(u.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className={`${td} text-slate-400`}>{u.branch?.name}</td>
                <td className={td}>{u.isActive ? <Badge tone="green">Aktif</Badge> : <Badge tone="slate">Nonaktif</Badge>}</td>
                <td className={`${td} text-right whitespace-nowrap`}>
                  <Button variant="ghost" size="sm" onClick={() => openForm(u)} aria-label={`Ubah ${u.name}`}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Hapus ${u.name}`}
                    onClick={async () => {
                      if (!confirmDelete(u.name)) return;
                      try {
                        await api(`/admin/users/${u.id}`, { method: 'DELETE' });
                        reload();
                      } catch (er) {
                        alert((er as Error).message);
                      }
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
          <Pagination page={data.page} total={data.total} limit={data.limit} onChange={setPage} />
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={`${editing ? 'Ubah' : 'Tambah'} ${ROLE_LABEL[role].toLowerCase()}`} wide>
        <form className="space-y-4" onSubmit={submit}>
          <ErrorBox message={error} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama lengkap">
              <input className="input" required minLength={2} value={form.name} onChange={set('name')} />
            </Field>
            <Field label="Email (untuk login)">
              <input className="input" type="email" required value={form.email} onChange={set('email')} />
            </Field>
            <Field label={editing ? 'Password baru (opsional)' : 'Password'}>
              <input className="input" type="password" required={!editing} minLength={6} autoComplete="new-password" value={form.password} onChange={set('password')} />
            </Field>
            <Field label="No. WhatsApp">
              <input className="input" value={form.phone} onChange={set('phone')} />
            </Field>
            {role === 'STUDENT' && (
              <>
                <Field label="Orang tua">
                  <select className="input" value={form.parentId} onChange={set('parentId')}>
                    <option value="">— Belum ditautkan —</option>
                    {parents?.data
                      .filter((p) => !scope.isSuper || !form.branchId || p.branchId === form.branchId)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.email})
                        </option>
                      ))}
                  </select>
                </Field>
                <Field label="Tanggal lahir">
                  <input className="input" type="date" value={form.birthDate} onChange={set('birthDate')} />
                </Field>
                <Field label="Sekolah">
                  <input className="input" value={form.school} onChange={set('school')} />
                </Field>
                <Field label="Level">
                  <input className="input" placeholder="Kids / Teens / Adult" value={form.level} onChange={set('level')} />
                </Field>
                <Field label="SPP khusus (Rp)" hint="Kosongkan untuk memakai nominal SPP cabang">
                  <input className="input" type="number" min={0} step={1000} placeholder="Ikut nominal cabang" value={form.monthlyFee} onChange={set('monthlyFee')} />
                </Field>
              </>
            )}
            {scope.isSuper && (
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
            )}
          </div>
          <Field label="Alamat">
            <input className="input" value={form.address} onChange={set('address')} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" className="size-4 accent-brand-500" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Akun aktif (bisa login)
          </label>
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
