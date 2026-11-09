'use client';

import { ExternalLink, Newspaper, Pencil, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { BranchNotice, SearchInput, Table, td, useBranchScope } from '@/components/admin';
import { Badge, Button, confirmDelete, Empty, ErrorBox, Field, ImageField, Modal, PageHeader, Pagination, Spinner, Tabs } from '@/components/ui';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { useApi, useDebounced } from '@/lib/hooks';
import type { MediaItem, Paged, Post, PostType } from '@/lib/types';
import { MediaUploader, VideoField } from '@/components/Media';

const EMPTY = { type: 'BLOG' as PostType, title: '', excerpt: '', content: '', coverUrl: '', videoUrl: '', media: [] as MediaItem[], published: true };

export default function AdminBlog() {
  const scope = useBranchScope();
  const [q, setQ] = useState('');
  const [type, setType] = useState<'' | PostType>('');
  const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  const { data, loading, reload } = useApi<Paged<Post>>('/admin/posts', { q: dq, type, page, limit: 15, branchId: scope.branchId });
  const [editing, setEditing] = useState<Post | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openForm = (p?: Post) => {
    setEditing(p ?? null);
    setError(null);
    setForm(
      p
        ? { type: p.type, title: p.title, excerpt: p.excerpt ?? '', content: p.content, coverUrl: p.coverUrl ?? '', videoUrl: p.videoUrl ?? '', media: p.media ?? [], published: p.published }
        : EMPTY,
    );
    setOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Blog & Vlog"
        desc="Tulis artikel atau unggah vlog (YouTube) untuk cabang Anda."
        action={
          <Button onClick={() => openForm()} disabled={scope.needBranch}>
            <Plus className="size-4" /> Tulis baru
          </Button>
        }
      />
      <BranchNotice />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1 sm:max-w-md">
          <SearchInput value={q} onChange={(v) => (setQ(v), setPage(1))} placeholder="Cari judul atau author…" />
        </div>
        <Tabs
          value={type}
          onChange={(v) => (setType(v), setPage(1))}
          items={[
            { value: '', label: 'Semua' },
            { value: 'BLOG', label: 'Blog' },
            { value: 'VLOG', label: 'Vlog' },
          ]}
        />
      </div>
      {loading && !data ? (
        <Spinner />
      ) : !data?.data.length ? (
        <Empty icon={<Newspaper className="size-8" />} title="Belum ada artikel" />
      ) : (
        <>
          <Table head={['Judul', 'Tipe', 'Author', 'Cabang', 'Tanggal', 'Status', '']}>
            {data.data.map((p) => (
              <tr key={p.id} className="hover:bg-white/[0.02]">
                <td className={`${td} max-w-xs`}>
                  <div className="truncate font-medium text-white">{p.title}</div>
                </td>
                <td className={td}>
                  <Badge tone={p.type === 'VLOG' ? 'navy' : 'blue'}>{p.type === 'VLOG' ? 'Vlog' : 'Blog'}</Badge>
                </td>
                <td className={`${td} text-slate-400`}>{p.author?.name}</td>
                <td className={`${td} text-slate-400`}>{p.branch?.name}</td>
                <td className={`${td} whitespace-nowrap text-slate-400`}>{formatDate(p.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                <td className={td}>{p.published ? <Badge tone="green">Terbit</Badge> : <Badge tone="slate">Draf</Badge>}</td>
                <td className={`${td} text-right whitespace-nowrap`}>
                  {p.published && (
                    <Link href={`/blog/${p.slug}`} target="_blank" className="inline-flex rounded-lg p-2 text-slate-400 hover:text-white" aria-label="Lihat">
                      <ExternalLink className="size-3.5" />
                    </Link>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => openForm(p)} aria-label="Ubah">
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Hapus"
                    onClick={async () => {
                      if (!confirmDelete(`"${p.title}"`)) return;
                      await api(`/admin/posts/${p.id}`, { method: 'DELETE' });
                      reload();
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

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Ubah artikel' : 'Artikel baru'} wide>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            const body = { ...form, excerpt: form.excerpt || undefined, coverUrl: form.coverUrl || undefined, videoUrl: form.videoUrl || undefined, ...(editing ? {} : { branchId: scope.branchId }) };
            try {
              await api(editing ? `/admin/posts/${editing.id}` : '/admin/posts', { method: editing ? 'PATCH' : 'POST', body });
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
          <Tabs
            value={form.type}
            onChange={(type) => setForm({ ...form, type })}
            items={[
              { value: 'BLOG', label: 'Blog' },
              { value: 'VLOG', label: 'Vlog' },
            ]}
          />
          <Field label="Judul">
            <input className="input" required minLength={3} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Ringkasan">
            <input className="input" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
          </Field>
          {form.type === 'VLOG' && <VideoField value={form.videoUrl} onChange={(videoUrl) => setForm({ ...form, videoUrl })} />}
          <ImageField label="Gambar sampul" value={form.coverUrl} onChange={(coverUrl) => setForm({ ...form, coverUrl })} />
          <MediaUploader label="Galeri foto & video (opsional)" value={form.media} onChange={(media) => setForm({ ...form, media })} />
          <Field label="Isi" hint="Pisahkan paragraf dengan baris kosong. Gunakan ## untuk sub-judul, - untuk daftar, **teks** untuk tebal.">
            <textarea className="input min-h-64 font-mono text-[13px]" required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" className="size-4 accent-brand-500" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
            Terbitkan ke halaman publik
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
