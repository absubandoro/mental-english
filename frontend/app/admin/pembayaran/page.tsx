'use client';

import { CreditCard, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { BranchNotice, SearchInput, Table, td, useBranchScope } from '@/components/admin';
import { Button, confirmDelete, Empty, ErrorBox, Field, Modal, PageHeader, Pagination, Spinner, Stat } from '@/components/ui';
import { api } from '@/lib/api';
import { formatDate, formatPeriod, PAYMENT_LABEL, rupiah, today } from '@/lib/format';
import { useApi, useDebounced } from '@/lib/hooks';
import type { Paged, Payment, PaymentStatus, User } from '@/lib/types';

const STATUS_STYLE: Record<PaymentStatus, string> = {
  LUNAS: 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10',
  MENUNGGU: 'text-amber-200 border-amber-400/30 bg-amber-500/10',
  BELUM_BAYAR: 'text-rose-300 border-rose-400/30 bg-rose-500/10',
};

const ALL = '__ALL__';

export default function AdminPembayaran() {
  const scope = useBranchScope();
  const [filter, setFilter] = useState({ q: '', status: '', period: '' });
  const [page, setPage] = useState(1);
  const dq = useDebounced(filter.q);
  const { data, loading, reload } = useApi<Paged<Payment> & { summary: { status: PaymentStatus; amount: number; count: number }[] }>('/admin/payments', {
    q: dq,
    status: filter.status,
    period: filter.period,
    page,
    branchId: scope.branchId,
  });
  const { data: students } = useApi<Paged<User>>('/admin/users', { role: 'STUDENT', limit: 100, branchId: scope.branchId });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ studentId: '', period: today().slice(0, 7), description: 'SPP Bulanan', amount: '450000', dueDate: '', status: 'BELUM_BAYAR' as PaymentStatus });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sum = (s: PaymentStatus) => data?.summary.find((x) => x.status === s);

  const updateStatus = async (p: Payment, status: PaymentStatus) => {
    const method = status === 'LUNAS' ? window.prompt('Metode pembayaran (opsional)', p.method ?? 'Transfer Bank') : undefined;
    if (method === null) return;
    await api(`/admin/payments/${p.id}`, { method: 'PATCH', body: { status, ...(method ? { method } : {}) } });
    reload();
  };

  return (
    <>
      <PageHeader
        title="Pembayaran"
        desc="Buat tagihan dan perbarui status pembayaran. Orang tua otomatis mendapat notifikasi."
        action={
          <Button onClick={() => (setError(null), setOpen(true))} disabled={scope.needBranch}>
            <Plus className="size-4" /> Buat tagihan
          </Button>
        }
      />
      <BranchNotice />
      <div className="mb-6 no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 [&>*]:w-[72%] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-auto">
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
                  <div className="font-medium text-white">{p.student?.name}</div>
                  <div className="text-xs text-slate-500">{p.student?.parent?.name ?? 'Tanpa orang tua'}</div>
                </td>
                <td className={`${td} whitespace-nowrap text-slate-300`}>{formatPeriod(p.period)}</td>
                <td className={`${td} text-slate-400`}>{p.description}</td>
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
                  {p.paidAt ? formatDate(p.paidAt, { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                  {p.method && <div>{p.method}</div>}
                </td>
                <td className={`${td} text-right`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Hapus"
                    onClick={async () => {
                      if (!confirmDelete('tagihan ini')) return;
                      await api(`/admin/payments/${p.id}`, { method: 'DELETE' });
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

      <Modal open={open} onClose={() => setOpen(false)} title="Buat tagihan">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            const ids = form.studentId === ALL ? (students?.data ?? []).map((s) => s.id) : [form.studentId];
            try {
              for (const studentId of ids) {
                await api('/admin/payments', {
                  method: 'POST',
                  body: { ...form, studentId, amount: Number(form.amount), dueDate: form.dueDate || undefined },
                });
              }
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
          <Field label="Status">
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as PaymentStatus })}>
              {(Object.keys(PAYMENT_LABEL) as PaymentStatus[]).map((s) => (
                <option key={s} value={s}>
                  {PAYMENT_LABEL[s]}
                </option>
              ))}
            </select>
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
