'use client';

import { CheckCircle2, MessageCircle, PhoneCall, UserPlus, XCircle } from 'lucide-react';
import { useState } from 'react';
import { BranchNotice, SearchInput, useBranchScope } from '@/components/admin';
import { useOrg } from '@/components/OrgProvider';
import { Badge, Button, Empty, ErrorBox, Field, Modal, PageHeader, Pagination, Spinner, Tabs } from '@/components/ui';
import { api } from '@/lib/api';
import { ENROLL_STATUS_LABEL, formatDate } from '@/lib/format';
import { useApi, useDebounced } from '@/lib/hooks';
import { ENROLL_TONE } from '@/lib/tones';
import type { ClassRoom, Enrollment, EnrollmentStatus, Paged } from '@/lib/types';

type Result = Paged<Enrollment> & { counts: Partial<Record<EnrollmentStatus, number>> };
type Accounts = { parentEmail: string; parentCreated: boolean; studentEmail: string; className: string | null };

const wa = (phone: string, text: string) => `https://wa.me/${phone.replace(/\D/g, '').replace(/^0/, '62')}?text=${encodeURIComponent(text)}`;

function age(birth: string | null) {
  if (!birth) return null;
  const b = new Date(birth + 'T00:00:00');
  const n = new Date();
  return n.getFullYear() - b.getFullYear() - (n < new Date(n.getFullYear(), b.getMonth(), b.getDate()) ? 1 : 0);
}

export default function Pendaftaran() {
  const scope = useBranchScope();
  const org = useOrg();
  const [status, setStatus] = useState<'' | EnrollmentStatus>('BARU');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  const { data, loading, reload } = useApi<Result>('/admin/enrollments', { status, q: dq, page, branchId: scope.branchId });
  const { data: classes } = useApi<ClassRoom[]>('/admin/classes', { branchId: scope.branchId });
  const [accepting, setAccepting] = useState<Enrollment | null>(null);
  const [classId, setClassId] = useState('');
  const [note, setNote] = useState('');
  const [result, setResult] = useState<Accounts | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patch = async (e: Enrollment, body: Record<string, unknown>) => {
    await api(`/admin/enrollments/${e.id}`, { method: 'PATCH', body });
    reload();
  };
  const c = data?.counts ?? {};

  return (
    <>
      <PageHeader title="Pendaftaran Siswa" desc="Calon siswa yang mendaftar dari website. Terima untuk membuat akun orang tua & pelajar secara otomatis." />
      <BranchNotice />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          value={status}
          onChange={(v) => (setStatus(v), setPage(1))}
          items={[
            { value: 'BARU', label: `Baru (${c.BARU ?? 0})` },
            { value: 'DIHUBUNGI', label: `Dihubungi (${c.DIHUBUNGI ?? 0})` },
            { value: 'DITERIMA', label: `Diterima (${c.DITERIMA ?? 0})` },
            { value: 'DITOLAK', label: `Ditolak (${c.DITOLAK ?? 0})` },
            { value: '', label: 'Semua' },
          ]}
        />
        <div className="lg:w-72">
          <SearchInput value={q} onChange={(v) => (setQ(v), setPage(1))} placeholder="Cari nama / no. WhatsApp…" />
        </div>
      </div>

      {loading && !data ? (
        <Spinner />
      ) : !data?.data.length ? (
        <Empty icon={<UserPlus className="size-8" />} title="Tidak ada pendaftaran" desc="Pendaftaran dari halaman Daftar Siswa akan muncul di sini." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.data.map((e) => {
            const a = age(e.studentBirthDate);
            return (
              <div key={e.id} className="card flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-bold text-white">{e.studentName}</h2>
                    <p className="text-sm text-slate-400">
                      {[e.program, a != null ? `${a} tahun` : null, e.studentSchool].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </div>
                  <Badge tone={ENROLL_TONE[e.status]}>{ENROLL_STATUS_LABEL[e.status]}</Badge>
                </div>
                <dl className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Orang tua</dt>
                    <dd className="text-right text-slate-200">{e.parentName}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">WhatsApp</dt>
                    <dd className="text-right text-slate-200">{e.parentPhone}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Email</dt>
                    <dd className="truncate text-right text-slate-200">{e.parentEmail}</dd>
                  </div>
                  {scope.isSuper && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Cabang</dt>
                      <dd className="text-right text-slate-200">{e.branch?.name}</dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Mendaftar</dt>
                    <dd className="text-right text-slate-200">{formatDate(e.createdAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</dd>
                  </div>
                </dl>
                {e.notes && <p className="mt-3 rounded-xl bg-white/[0.03] px-3 py-2 text-sm text-slate-300">“{e.notes}”</p>}
                {e.adminNote && <p className="mt-2 text-xs text-amber-200/90">Catatan admin: {e.adminNote}</p>}
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  <a
                    href={wa(e.parentPhone, `Halo ${e.parentName}, terima kasih telah mendaftarkan ${e.studentName} di ${org.name}. `)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25"
                  >
                    <MessageCircle className="size-3.5" /> WhatsApp
                  </a>
                  {e.status === 'BARU' && (
                    <Button variant="secondary" size="sm" onClick={() => patch(e, { status: 'DIHUBUNGI' })}>
                      <PhoneCall className="size-3.5" /> Tandai dihubungi
                    </Button>
                  )}
                  {(e.status === 'BARU' || e.status === 'DIHUBUNGI') && (
                    <>
                      <Button size="sm" onClick={() => (setAccepting(e), setClassId(''), setNote(''), setResult(null), setError(null))}>
                        <CheckCircle2 className="size-3.5" /> Terima
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const reason = window.prompt('Alasan ditolak (catatan internal)', '');
                          if (reason !== null) patch(e, { status: 'DITOLAK', adminNote: reason || undefined });
                        }}
                      >
                        <XCircle className="size-3.5" /> Tolak
                      </Button>
                    </>
                  )}
                  {e.status === 'DITOLAK' && (
                    <Button variant="ghost" size="sm" onClick={() => patch(e, { status: 'BARU' })}>
                      Pulihkan
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {data && <Pagination page={data.page} total={data.total} limit={data.limit} onChange={setPage} />}

      <Modal open={!!accepting} onClose={() => setAccepting(null)} title={result ? 'Pendaftaran diterima 🎉' : `Terima ${accepting?.studentName ?? ''}`}>
        {result ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">Akun sudah dibuat dan orang tua menerima notifikasi selamat datang. Password = password yang dibuat saat mendaftar.</p>
            <div className="space-y-2 rounded-2xl bg-white/[0.03] p-4 text-sm ring-1 ring-white/10">
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Akun orang tua</span>
                <span className="text-right text-white">
                  {result.parentEmail}
                  {!result.parentCreated && <span className="block text-xs text-slate-400">(akun lama ditautkan)</span>}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Akun pelajar</span>
                <span className="text-right break-all text-white">{result.studentEmail}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Kelas</span>
                <span className="text-right text-white">{result.className ?? 'Belum ditentukan'}</span>
              </div>
            </div>
            {accepting && (
              <a
                href={wa(
                  accepting.parentPhone,
                  `Halo ${accepting.parentName}, pendaftaran ${accepting.studentName} di ${org.name} telah DITERIMA${result.className ? ` di kelas ${result.className}` : ''}. ` +
                    `Silakan masuk di website kami dengan email ${result.parentEmail}. Akun pelajar: ${result.studentEmail}. Password sama dengan saat mendaftar.`,
                )}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-400"
              >
                <MessageCircle className="size-4" /> Kabari lewat WhatsApp
              </a>
            )}
            <Button variant="secondary" className="w-full" onClick={() => setAccepting(null)}>
              Selesai
            </Button>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={async (ev) => {
              ev.preventDefault();
              if (!accepting) return;
              setBusy(true);
              setError(null);
              try {
                const r = await api<Enrollment & { accounts: Accounts }>(`/admin/enrollments/${accepting.id}/accept`, {
                  method: 'POST',
                  body: { classId: classId || undefined, adminNote: note || undefined },
                });
                setResult(r.accounts);
                reload();
              } catch (er) {
                setError((er as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <ErrorBox message={error} />
            <p className="text-sm text-slate-300">
              Akun orang tua (<b>{accepting?.parentEmail}</b>) dan akun pelajar akan dibuat dengan password yang dibuat pendaftar.
            </p>
            <Field label="Masukkan ke kelas (opsional)">
              <select className="input" value={classId} onChange={(e) => setClassId(e.target.value)}>
                <option value="">Nanti saja</option>
                {classes?.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name} {k.schedule ? `· ${k.schedule}` : ''}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Catatan admin (opsional)">
              <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="mis. hasil tes penempatan: Kids level 2" />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setAccepting(null)}>
                Batal
              </Button>
              <Button type="submit" loading={busy}>
                Terima & buat akun
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
