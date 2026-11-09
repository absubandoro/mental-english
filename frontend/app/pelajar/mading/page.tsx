'use client';

import { Palette, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { MadingGrid } from '@/components/MadingGrid';
import { MediaUploader } from '@/components/Media';
import { Button, confirmDelete, Empty, ErrorBox, Field, Modal, PageHeader, Pagination, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { useApi } from '@/lib/hooks';
import type { Mading, MediaItem, Paged } from '@/lib/types';

const CATEGORIES = ['Karya Tulis', 'Cerita', 'Puisi', 'Opini', 'Gambar', 'Lainnya'];
const EMPTY = { title: '', content: '', imageUrl: '', category: 'Karya Tulis', media: [] as MediaItem[] };

export default function MadingSaya() {
  const [page, setPage] = useState(1);
  const { data, loading, reload } = useApi<Paged<Mading>>('/student/mading', { page, limit: 12 });
  const [editing, setEditing] = useState<Mading | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openForm = (m?: Mading) => {
    setEditing(m ?? null);
    setForm(m ? { title: m.title, content: m.content, imageUrl: m.imageUrl ?? '', category: m.category, media: m.media ?? [] } : EMPTY);
    setError(null);
    setOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Mading Saya"
        desc="Tempel karya bahasa Inggrismu di mading dan bagikan ke semua orang."
        action={
          <Button onClick={() => openForm()}>
            <Plus className="size-4" /> Buat mading
          </Button>
        }
      />
      {loading && !data ? (
        <Spinner />
      ) : !data?.data.length ? (
        <Empty icon={<Palette className="size-8" />} title="Belum ada karya" desc="Yuk tulis cerita, puisi, atau opini pertamamu dalam bahasa Inggris!" />
      ) : (
        <>
          <MadingGrid
            items={data.data}
            actions={(m) => (
              <>
                <Button variant="ghost" size="sm" onClick={() => openForm(m)} aria-label="Ubah">
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Hapus"
                  onClick={async () => {
                    if (!confirmDelete(`"${m.title}"`)) return;
                    await api(`/student/mading/${m.id}`, { method: 'DELETE' });
                    reload();
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </>
            )}
          />
          <Pagination page={data.page} total={data.total} limit={data.limit} onChange={setPage} />
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Ubah mading' : 'Mading baru'}>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            try {
              await api(editing ? `/student/mading/${editing.id}` : '/student/mading', {
                method: editing ? 'PATCH' : 'POST',
                body: { ...form, imageUrl: form.imageUrl || undefined },
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
          <Field label="Judul">
            <input className="input" required minLength={3} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Kategori">
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Isi karya">
            <textarea className="input min-h-40" required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          </Field>
          <MediaUploader label="Foto & video karya (opsional)" max={6} value={form.media} onChange={(media) => setForm({ ...form, media })} />
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
