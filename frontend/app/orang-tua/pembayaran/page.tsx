'use client';

import { AlertTriangle, CheckCircle2, Clock, Copy, ImagePlus, Landmark, Loader2, Receipt, Upload, Wallet } from 'lucide-react';
import { useRef, useState } from 'react';
import { Badge, Button, Empty, ErrorBox, Field, Modal, PageHeader, Spinner, Stat } from '@/components/ui';
import { api, uploadFile } from '@/lib/api';
import { formatDate, formatPeriod, PAYMENT_LABEL, rupiah, today } from '@/lib/format';
import { useApi } from '@/lib/hooks';
import { PAY_TONE } from '@/lib/tones';
import type { BankAccount, Payment } from '@/lib/types';

interface BillingInfo {
  id: string;
  name: string;
  bankAccounts: BankAccount[];
  paymentInstructions: string | null;
}

function CopyText({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard?.writeText(text).then(() => (setOk(true), setTimeout(() => setOk(false), 1500)))}
      className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/15"
    >
      <Copy className="size-3" /> {ok ? 'Tersalin' : 'Salin'}
    </button>
  );
}

function PayModal({ payment, info, onClose, onDone }: { payment: Payment; info: BillingInfo | undefined; onClose: () => void; onDone: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [method, setMethod] = useState(info?.bankAccounts[0] ? `Transfer ${info.bankAccounts[0].bank}` : 'Transfer Bank');
  const [note, setNote] = useState('');
  const [pct, setPct] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Modal open onClose={onClose} title="Bayar tagihan">
      <div className="space-y-5">
        <div className="rounded-2xl bg-gradient-to-br from-brand-500/20 to-navy-600/30 p-4 ring-1 ring-white/10">
          <div className="text-xs text-slate-300">
            {payment.description} · {formatPeriod(payment.period)} · {payment.student?.name}
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="font-display text-3xl font-bold text-white">{rupiah(payment.amount)}</span>
            <CopyText text={String(payment.amount)} />
          </div>
          {payment.dueDate && <div className="mt-1 text-xs text-slate-400">Jatuh tempo {formatDate(payment.dueDate)}</div>}
        </div>

        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
            <Landmark className="size-4 text-brand-300" /> 1. Transfer ke rekening
          </h3>
          {info?.bankAccounts.length ? (
            <div className="space-y-2">
              {info.bankAccounts.map((b) => (
                <div key={b.number} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.04] px-4 py-3 ring-1 ring-white/10">
                  <div>
                    <div className="text-xs text-slate-400">{b.bank}</div>
                    <div className="font-mono text-lg font-semibold tracking-wide text-white">{b.number}</div>
                    <div className="text-xs text-slate-400">a.n. {b.holder}</div>
                  </div>
                  <CopyText text={b.number} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Hubungi admin cabang untuk info rekening.</p>
          )}
          {info?.paymentInstructions && <p className="mt-2 text-xs text-slate-400">{info.paymentInstructions}</p>}
        </div>

        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!proofUrl) return setError('Unggah foto bukti transfer terlebih dahulu');
            setBusy(true);
            setError(null);
            try {
              await api(`/parent/payments/${payment.id}/proof`, { method: 'POST', body: { proofUrl, method, note: note || undefined } });
              onDone();
            } catch (er) {
              setError((er as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Upload className="size-4 text-brand-300" /> 2. Unggah bukti transfer
          </h3>
          <ErrorBox message={error} />
          <button
            type="button"
            onClick={() => ref.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed border-white/20 bg-white/[0.02] p-4 text-slate-400 transition hover:border-brand-400 hover:text-brand-200"
          >
            {proofUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={proofUrl} alt="Bukti transfer" className="max-h-64 rounded-xl object-contain" />
            ) : pct != null ? (
              <>
                <Loader2 className="size-7 animate-spin text-brand-300" />
                <span className="text-sm">Mengunggah… {pct}%</span>
              </>
            ) : (
              <>
                <ImagePlus className="size-8" />
                <span className="text-sm">Ketuk untuk memilih foto / screenshot bukti transfer</span>
              </>
            )}
          </button>
          {proofUrl && (
            <button type="button" className="text-xs text-brand-300 hover:underline" onClick={() => ref.current?.click()}>
              Ganti foto
            </button>
          )}
          <input
            ref={ref}
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (!f) return;
              setError(null);
              setPct(0);
              try {
                setProofUrl((await uploadFile(f, setPct)).url);
              } catch (er) {
                setError((er as Error).message);
              } finally {
                setPct(null);
              }
            }}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Metode">
              <input className="input" value={method} onChange={(e) => setMethod(e.target.value)} />
            </Field>
            <Field label="Catatan (opsional)">
              <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="mis. transfer dari rek. ayah" />
            </Field>
          </div>
          <Button type="submit" loading={busy} disabled={!proofUrl || pct != null} className="w-full">
            Kirim bukti pembayaran
          </Button>
        </form>
      </div>
    </Modal>
  );
}

export default function LaporanPembayaran() {
  const { data, loading, reload } = useApi<{ data: Payment[]; summary: { paid: number; unpaid: number; pending: number } }>('/parent/payments');
  const { data: info } = useApi<BillingInfo[]>('/parent/billing-info');
  const [pay, setPay] = useState<Payment | null>(null);
  const [done, setDone] = useState(false);
  const now = today();
  const open = data?.data.filter((p) => p.status !== 'LUNAS') ?? [];
  const history = data?.data.filter((p) => p.status === 'LUNAS') ?? [];

  return (
    <>
      <PageHeader title="Pembayaran" desc="Tagihan, unggah bukti transfer, dan riwayat pembayaran anak Anda." />
      {done && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 className="size-4 shrink-0" /> Bukti terkirim. Kami akan memberi tahu Anda setelah pembayaran diverifikasi.
        </div>
      )}
      {loading || !data ? (
        <Spinner />
      ) : (
        <div className="space-y-6">
          <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 [&>*]:w-[72%] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-auto">
            <Stat label="Belum dibayar" value={rupiah(data.summary.unpaid)} icon={<Wallet className="size-5 text-rose-300" />} tone="from-rose-500/15" />
            <Stat label="Menunggu verifikasi" value={rupiah(data.summary.pending)} icon={<Clock className="size-5 text-amber-300" />} tone="from-amber-500/15" />
            <Stat label="Sudah dibayar" value={rupiah(data.summary.paid)} icon={<CheckCircle2 className="size-5 text-emerald-300" />} tone="from-emerald-500/15" />
          </div>

          <section>
            <h2 className="mb-3 font-display text-lg font-bold text-white">Tagihan aktif</h2>
            {open.length === 0 ? (
              <Empty icon={<CheckCircle2 className="size-8" />} title="Semua tagihan sudah lunas" desc="Terima kasih! Tagihan berikutnya akan muncul di sini." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {open.map((p) => {
                  const overdue = p.status === 'BELUM_BAYAR' && p.dueDate && p.dueDate < now;
                  return (
                    <div key={p.id} className={`card p-4 sm:p-5 ${overdue ? 'border-rose-400/30' : ''}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs text-slate-400">
                            {p.student?.name} · {formatPeriod(p.period)}
                          </div>
                          <div className="font-semibold text-white">{p.description}</div>
                        </div>
                        <Badge tone={PAY_TONE[p.status]}>{PAYMENT_LABEL[p.status]}</Badge>
                      </div>
                      <div className="mt-3 font-display text-2xl font-bold text-white">{rupiah(p.amount)}</div>
                      {p.dueDate && (
                        <div className={`mt-0.5 text-xs ${overdue ? 'font-semibold text-rose-300' : 'text-slate-400'}`}>
                          {overdue ? 'Lewat jatuh tempo' : 'Jatuh tempo'} {formatDate(p.dueDate)}
                        </div>
                      )}
                      {p.status === 'BELUM_BAYAR' && p.rejectionReason && (
                        <div className="mt-3 flex gap-2 rounded-xl bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                          <span>
                            Bukti sebelumnya ditolak: <b>{p.rejectionReason}</b>. Silakan unggah ulang.
                          </span>
                        </div>
                      )}
                      {p.status === 'MENUNGGU' ? (
                        <div className="mt-4 flex items-center gap-2 text-xs text-amber-200">
                          <Clock className="size-4" /> Bukti terkirim {formatDate(p.proofUploadedAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}, menunggu verifikasi.
                        </div>
                      ) : (
                        <Button className="mt-4 w-full" onClick={() => (setDone(false), setPay(p))}>
                          <Receipt className="size-4" /> Bayar / Unggah bukti
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-bold text-white">Riwayat pembayaran</h2>
            {history.length === 0 ? (
              <Empty title="Belum ada riwayat" />
            ) : (
              <div className="table-cards sm:overflow-x-auto sm:rounded-2xl sm:border sm:border-white/8 sm:bg-ink-850/70">
                <table className="w-full text-sm sm:min-w-[640px]">
                  <thead className="bg-white/[0.02] text-left text-xs text-slate-400 uppercase">
                    <tr>
                      <th className="px-6 py-3 font-medium">Periode</th>
                      <th className="px-3 py-3 font-medium">Anak</th>
                      <th className="px-3 py-3 font-medium">Keterangan</th>
                      <th className="px-3 py-3 text-right font-medium">Jumlah</th>
                      <th className="px-6 py-3 font-medium">Dibayar</th>
                    </tr>
                  </thead>
                  <tbody className="sm:divide-y sm:divide-white/5">
                    {history.map((p) => (
                      <tr key={p.id}>
                        <td data-label="Periode" className="px-6 py-3 whitespace-nowrap text-slate-200">
                          {formatPeriod(p.period)}
                        </td>
                        <td data-label="Anak" className="px-3 py-3 text-slate-300">
                          {p.student?.name}
                        </td>
                        <td data-label="Keterangan" className="px-3 py-3 text-slate-400">
                          {p.description}
                        </td>
                        <td data-label="Jumlah" className="px-3 py-3 text-right font-semibold whitespace-nowrap text-white">
                          {rupiah(p.amount)}
                        </td>
                        <td data-label="Dibayar" className="px-6 py-3 text-xs text-slate-400">
                          <div>{p.paidAt ? formatDate(p.paidAt) : '-'}</div>
                          {p.method && <div>{p.method}</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
      {pay && (
        <PayModal
          payment={pay}
          info={info?.find((b) => b.id === pay.branchId) ?? info?.[0]}
          onClose={() => setPay(null)}
          onDone={() => {
            setPay(null);
            setDone(true);
            reload();
          }}
        />
      )}
    </>
  );
}
