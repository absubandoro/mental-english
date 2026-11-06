'use client';

import { Building2, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button, confirmDelete, Empty, ErrorBox, Field, Modal, PageHeader, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Branch } from '@/lib/types';
import { useBranches } from '@/lib/useBranches';

const EMPTY = { name: '', city: '', address: '', phone: '', openHours: '', mapQuery: '' };

export default function AdminCabang() {
  const { user } = useAuth();
  const { branches, loading, reload } = useBranches();
  const [editing, setEditing] = useState<Branch | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (user?.role !== 'SUPER_ADMIN') return <Empty title="Hanya super admin yang dapat mengelola cabang" />;

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });
  const openForm = (b?: Branch) => {
    setEditing(b ?? null);
    setError(null);
    setForm(b ? { name: b.name, city: b.city ?? '', address: b.address ?? '', phone: b.phone ?? '', openHours: b.openHours ?? '', mapQuery: b.mapQuery ?? '' } : EMPTY);
    setOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Cabang"
        desc="Data cabang tampil di halaman Lokasi Kami dan menjadi filter blog & mading."
        action={
          <Button onClick={() => openForm()}>
            <Plus className="size-4" /> Cabang baru
          </Button>
        }
      />
      {loading ? (
        <Spinner />
      ) : !branches.length ? (
        <Empty icon={<Building2 className="size-8" />} title="Belum ada cabang" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {branches.map((b) => (
            <div key={b.id} className="card p-5">
              <h2 className="font-display text-lg font-bold text-white">{b.name}</h2>
              <p className="mt-1 flex gap-2 text-sm text-slate-400">
                <MapPin className="mt-0.5 size-4 shrink-0" /> {b.address ?? '-'}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {b.phone} {b.openHours && `· ${b.openHours}`}
              </p>
              <div className="mt-4 flex justify-end gap-1">
                <Button variant="secondary" size="sm" onClick={() => openForm(b)}>
                  <Pencil className="size-3.5" /> Ubah
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Hapus"
                  onClick={async () => {
                    if (!confirmDelete(`cabang ${b.name} beserta seluruh data kelas, blog, mading & pembayarannya`)) return;
                    await api(`/branches/${b.id}`, { method: 'DELETE' });
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
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Ubah cabang' : 'Cabang baru'}>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            try {
              await api(editing ? `/branches/${editing.id}` : '/branches', { method: editing ? 'PATCH' : 'POST', body: form });
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
          <Field label="Nama cabang">
            <input className="input" required minLength={2} value={form.name} onChange={set('name')} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kota">
              <input className="input" value={form.city} onChange={set('city')} />
            </Field>
            <Field label="Telepon / WhatsApp">
              <input className="input" value={form.phone} onChange={set('phone')} />
            </Field>
          </div>
          <Field label="Alamat">
            <input className="input" value={form.address} onChange={set('address')} />
          </Field>
          <Field label="Jam buka">
            <input className="input" placeholder="Senin–Sabtu, 08.00–20.00" value={form.openHours} onChange={set('openHours')} />
          </Field>
          <Field label="Lokasi peta" hint="Alamat / nama tempat untuk Google Maps, atau URL embed Google Maps lengkap.">
            <input className="input" value={form.mapQuery} onChange={set('mapQuery')} />
          </Field>
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
