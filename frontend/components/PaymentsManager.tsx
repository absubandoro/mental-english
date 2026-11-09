'use client';

import { CheckCircle2, CreditCard, ExternalLink, Plus, ReceiptText, Settings2, Trash2, XCircle, Zap } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate, formatPeriod, PAYMENT_LABEL, rupiah, today } from '@/lib/format';
import { useApi, useDebounced } from '@/lib/hooks';
import type { Paged, Payment, PaymentStatus, User } from '@/lib/types';
import { BranchNotice, SearchInput, Table, td, useBranchScope } from './admin';
import { Avatar, Badge, Button, confirmDelete, Empty, ErrorBox, Field, Modal, PageHeader, Pagination, Spinner, Stat, Tabs } from './ui';

const STATUS_STYLE: Record<PaymentStatus, string> = {
  LUNAS: 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10',
  MENUNGGU: 'text-amber-200 border-amber-400/30 bg-amber-500/10',
  BELUM_BAYAR: 'text-rose-300 border-rose-400/30 bg-rose-500/10',
};
const ALL = '__ALL__';
type Result = Paged<Payment> & { summary: { status: PaymentStatus; amount: number; count: number }[] };

/** Antrian bukti pembayaran yang menunggu verifikasi */
function VerifyQueue({ branchId, onChanged }: { branchId?: string; onChanged: () => void }) {
  const [page, setPage] = useState(1);
  const { data, loading, reload } = useApi<Result>('/admin/payments', { status: 'MENUNGGU', page, branchId });
  const [sel, setSel] = useState<Payment | null>(null);
  const [reason, setReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const decide = async (approve: boolean) => {
    if (!sel) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/admin/payments/${sel.id}/verify`, { method: 'POST', body: { approve, reason: approve ? undefined : reason } });
      setSel(null);
      reload();
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading && !data) return <Spinner />;
  if (!data?.data.length)
    return <Empty icon={<CheckCircle2 className="size-8" />} title="Tidak ada pembayaran yang menunggu verifikasi" desc="Bukti transfer yang diunggah orang tua akan muncul di sini." />;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.data.map((p) => (
          <button
            key={p.id}
            onClick={() => (setSel(p), setReason(''), setRejecting(false), setError(null))}
            className="card group overflow-hidden text-left transition hover:border-amber-300/40 active:scale-[0.99]"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-ink-900">
              {p.proofUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.proofUrl} alt="Bukti transfer" className="size-full object-cover object-top transition duration-300 group-hover:scale-105" />
              ) : (
                <div className="flex size-full items-center justify-center text-sm text-slate-500">Tanpa bukti</div>
              )}
              <span className="absolute top-2 left-2">
                <Badge tone="amber">Menunggu verifikasi</Badge>
              </span>
            </div>
            <div className="space-y-1 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-white">{p.student?.name}</span>
                <span className="font-display font-bold text-white">{rupiah(p.amount)}</span>
              </div>
              <div className="text-xs text-slate-400">
                {p.description} · {formatPeriod(p.period)}
              </div>
              <div className="text-xs text-slate-500">
                Diunggah {formatDate(p.proofUploadedAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                {p.method && ` · ${p.method}`}
              </div>
            </div>
          </button>
        ))}
      </div>
      <Pagination page={data.page} total={data.total} limit={data.limit} onChange={setPage} />

      <Modal open={!!sel} onClose={() => setSel(null)} title="Verifikasi pembayaran" wide>
        {sel && (
          <div className="grid gap-5 md:grid-cols-[1fr_300px]">
            <div className="overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
              {sel.proofUrl ? (
                <a href={sel.proofUrl} target="_blank" rel="noreferrer" className="group relative block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={sel.proofUrl} alt="Bukti transfer" className="max-h-[60dvh] w-full object-contain" />
                  <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-lg bg-ink-950/80 px-2 py-1 text-xs text-white">
                    <ExternalLink className="size-3" /> Buka ukuran penuh
                  </span>
                </a>
              ) : (
                <p className="p-6 text-sm text-slate-400">Tidak ada bukti terlampir.</p>
              )}
            </div>
            <div className="space-y-4">
              <dl className="space-y-2 text-sm">
                {[
                  ['Pelajar', sel.student?.name],
                  ['Orang tua', sel.student?.parent?.name ?? '-'],
                  ['Tagihan', `${sel.description} · ${formatPeriod(sel.period)}`],
                  ['Jumlah', rupiah(sel.amount)],
                  ['Jatuh tempo', formatDate(sel.dueDate)],
                  ['Metode', sel.method ?? '-'],
                  ['Catatan ortu', sel.proofNote ?? '-'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <dt className="text-slate-500">{k}</dt>
                    <dd className="text-right text-slate-200">{v}</dd>
                  </div>
                ))}
              </dl>
              <ErrorBox message={error} />
              {rejecting ? (
                <div className="space-y-3">
                  <Field label="Alasan penolakan (dikirim ke orang tua)">
                    <textarea className="input min-h-24" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="mis. Nominal transfer tidak sesuai / bukti tidak terbaca" />
                  </Field>
                  <div className="flex gap-2">
                    <Button variant="secondary" className="flex-1" onClick={() => setRejecting(false)}>
                      Batal
                    </Button>
                    <Button variant="danger" className="flex-1" loading={busy} disabled={!reason.trim()} onClick={() => decide(false)}>
                      Tolak
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-2">
                  <Button loading={busy} onClick={() => decide(true)} className="bg-emerald-500 hover:bg-emerald-400">
                    <CheckCircle2 className="size-4" /> Terima — tandai Lunas
                  </Button>
                  <Button variant="danger" onClick={() => setRejecting(true)}>
                    <XCircle className="size-4" /> Tolak bukti
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

/** Halaman pembayaran untuk Admin & Keuangan */
export function PaymentsManager({ settingsHref }: { settingsHref: string }) {
  const scope = useBranchScope();
  const { user } = useAuth();
  const [tab, setTab] = useState<'verify' | 'all'>('verify');
  const [filter, setFilter] = useState({ q: '', status: '', period: '' });
  const [page, setPage] = useState(1);
  const dq = useDebounced(filter.q);
  const { data, loading, reload } = useApi<Result>('/admin/payments', {
    q: dq,
    status: filter.status,
    period: filter.period,
    page,
    branchId: scope.branchId,
  });
  const { data: pending, reload: reloadPending } = useApi<{ count: number }>('/admin/payments/pending-count', { branchId: scope.branchId });
  const { data: students } = useApi<Paged<User>>(user?.role === 'FINANCE' ? null : '/admin/users', { role: 'STUDENT', limit: 100, branchId: scope.branchId });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ studentId: '', period: today().slice(0, 7), description: 'SPP Bulanan', amount: '450000', dueDate: '', status: 'BELUM_BAYAR' as PaymentStatus });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sum = (s: PaymentStatus) => data?.summary.find((x) => x.status === s);
  const refresh = () => {
    reload();
    reloadPending();
  };

  const updateStatus = async (p: Payment, status: PaymentStatus) => {
    const method = status === 'LUNAS' ? window.prompt('Metode pembayaran (opsional)', p.method ?? 'Transfer Bank') : undefined;
    if (method === null) return;
    await api(`/admin/payments/${p.id}`, { method: 'PATCH', body: { status, ...(method ? { method } : {}) } });
    refresh();
  };

  return (
    <>
      <PageHeader
        title="Pembayaran"
        desc="Verifikasi bukti transfer dari orang tua dan pantau semua tagihan. Orang tua otomatis mendapat notifikasi."
        action={
          <div className="flex flex-wrap gap-2">
            <Link href={settingsHref} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-100 hover:bg-white/10">
              <Settings2 className="size-4" /> Pengaturan tagihan
            </Link>
            {user?.role !== 'FINANCE' && (
              <Button onClick={() => (setError(null), setOpen(true))} disabled={scope.needBranch}>
                <Plus className="size-4" /> Tagihan manual
              </Button>
            )}
          </div>
        }
      />
      <BranchNotice />
      <div className="no-scrollbar -mx-4 mb-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 [&>*]:w-[72%] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-auto">
        {(['LUNAS', 'MENUNGGU', 'BELUM_BAYAR'] as PaymentStatus[]).map((s) => (
          <Stat
            key={s}
            label={PAYMENT_LABEL[s]}
            value={rupiah(sum(s)?.amount ?? 0)}
            icon={<span className="text-xs">{sum(s)?.count ?? 0} tagihan</span>}
            tone={s === 'LUNAS' ? 'from-emerald-500/15' : s === 'MENUNGGU' ? 'from-amber-500/15' : 'from-rose-500/15'}
          />
        ))}
      </div>

      <div className="mb-5">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: 'verify', label: `Perlu verifikasi${pending?.count ? ` (${pending.count})` : ''}` },
            { value: 'all', label: 'Semua tagihan' },
          ]}
        />
      </div>

      {tab === 'verify' ? (
        <VerifyQueue branchId={scope.branchId} onChanged={refresh} />
      ) : (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_200px_180px]">
            <SearchInput value={filter.q} onChange={(q) => (setFilter({ ...filter, q }), setPage(1))} placeholder="Cari nama pelajar / keterangan…" />
            <select className="input" value={filter.status} onChange={(e) => (setFilter({ ...filter, status: e.target.value }), setPage(1))} aria-label="Filter status">
              <option value="">Semua status</option>
              {(Object.keys(PAYMENT_LABEL) as PaymentStatus[]).map((s) => (
                <option key={s} value={s}>
                  {PAYMENT_LABEL[s]}
                </option>
              ))}
            </select>
            <input type="month" className="input" value={filter.period} onChange={(e) => (setFilter({ ...filter, period: e.target.value }), setPage(1))} aria-label="Filter periode" />
          </div>
          {loading && !data ? (
            <Spinner />
          ) : !data?.data.length ? (
            <Empty icon={<CreditCard className="size-8" />} title="Belum ada tagihan" />
          ) : (
            <>
              <Table head={['Pelajar', 'Periode', 'Keterangan', 'Jumlah', 'Status', 'Dibayar', '']}>
                {data.data.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02]">
                    <td className={td}>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={p.student?.name ?? '?'} src={p.student?.avatarUrl} size={30} />
                        <div>
                          <div className="font-medium text-white">{p.student?.name}</div>
                          <div className="text-xs text-slate-500">{p.student?.parent?.name ?? 'Tanpa orang tua'}</div>
                        </div>
                      </div>
                    </td>
                    <td className={`${td} whitespace-nowrap text-slate-300`}>{formatPeriod(p.period)}</td>
                    <td className={`${td} text-slate-400`}>
                      <div>{p.description}</div>
                      <div className="mt-0.5 flex flex-wrap justify-end gap-1 sm:justify-start">
                        {p.source === 'AUTO' && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-brand-500/15 px-1.5 py-0.5 text-[10px] text-brand-200">
                            <Zap className="size-3" /> Otomatis
                          </span>
                        )}
                        {p.rejectionReason && p.status === 'BELUM_BAYAR' && <span className="rounded-md bg-rose-500/15 px-1.5 py-0.5 text-[10px] text-rose-200">Bukti ditolak</span>}
                      </div>
                    </td>
                    <td className={`${td} font-semibold whitespace-nowrap text-white`}>{rupiah(p.amount)}</td>
                    <td className={td}>
                      <select
                        className={`rounded-lg border px-2 py-1 text-xs font-semibold outline-none ${STATUS_STYLE[p.status]}`}
                        value={p.status}
                        onChange={(e) => updateStatus(p, e.target.value as PaymentStatus)}
                        aria-label={`Status pembayaran ${p.student?.name}`}
                      >
                        {(Object.keys(PAYMENT_LABEL) as PaymentStatus[]).map((s) => (
                          <option key={s} value={s} className="bg-ink-900 text-white">
                            {PAYMENT_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className={`${td} text-xs text-slate-400`}>
                      <div>{p.paidAt ? formatDate(p.paidAt, { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</div>
                      {p.method && <div>{p.method}</div>}
                      {p.verifiedBy && p.status === 'LUNAS' && <div className="text-slate-500">oleh {p.verifiedBy.name}</div>}
                    </td>
                    <td className={`${td} text-right whitespace-nowrap`}>
                      {p.proofUrl && (
                        <a href={p.proofUrl} target="_blank" rel="noreferrer" className="inline-flex rounded-lg p-2 text-slate-400 hover:text-white" aria-label="Lihat bukti" title="Lihat bukti">
                          <ReceiptText className="size-3.5" />
                        </a>
                      )}
                      {user?.role !== 'FINANCE' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Hapus"
                          onClick={async () => {
                            if (!confirmDelete('tagihan ini')) return;
                            await api(`/admin/payments/${p.id}`, { method: 'DELETE' });
                            refresh();
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </Table>
              <Pagination page={data.page} total={data.total} limit={data.limit} onChange={setPage} />
            </>
          )}
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Buat tagihan manual">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            const ids = form.studentId === ALL ? (students?.data ?? []).map((s) => s.id) : [form.studentId];
            try {
              for (const studentId of ids) {
                await api('/admin/payments', { method: 'POST', body: { ...form, studentId, amount: Number(form.amount), dueDate: form.dueDate || undefined } });
              }
              setOpen(false);
              setTab('all');
              refresh();
            } catch (er) {
              setError((er as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <p className="rounded-xl bg-brand-500/10 px-3 py-2 text-xs text-brand-100">
            SPP bulanan dibuat otomatis sesuai <Link href={settingsHref} className="underline">pengaturan tagihan</Link>. Gunakan form ini untuk biaya lain (pendaftaran, buku, seragam, dll).
          </p>
          <ErrorBox message={error} />
          <Field label="Pelajar">
            <select className="input" required value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
              <option value="">Pilih pelajar</option>
              <option value={ALL}>★ Semua pelajar ({students?.data.length ?? 0})</option>
              {students?.data.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Periode">
              <input className="input" type="month" required value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} />
            </Field>
            <Field label="Jatuh tempo">
              <input className="input" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </Field>
            <Field label="Keterangan">
              <input className="input" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <Field label="Jumlah (Rp)">
              <input className="input" type="number" min={0} required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </Field>
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
