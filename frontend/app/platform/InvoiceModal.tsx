'use client';

import { Check, ExternalLink, Ban, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { InvoiceDetail, type SystemInvoice } from '@/components/SystemInvoice';
import { Button, ErrorBox, Field, Modal } from '@/components/ui';
import { formatDate, today } from '@/lib/format';
import { papi } from '@/lib/platform';

/** Detail tagihan untuk pengelola: verifikasi bukti, tandai lunas, batalkan, catatan */
export function InvoiceModal({ inv, onClose, onChanged }: { inv: SystemInvoice | null; onClose: () => void; onChanged: () => void }) {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    setReason('');
    setNote(inv?.note ?? '');
    setErr(null);
  }, [inv]);

  const run = async (key: string, path: string, method: string, body: unknown) => {
    setBusy(key);
    setErr(null);
    try {
      await papi(path, { method, body });
      onChanged();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal open={!!inv} onClose={onClose} title={inv?.organization ? `Tagihan · ${inv.organization.name}` : 'Tagihan'} wide>
      {inv && (
        <div className="grid gap-6 md:grid-cols-[1fr_0.9fr]">
          <InvoiceDetail inv={inv} today={today()} />
          <div className="space-y-4">
            <ErrorBox message={err} />
            {inv.proofUrl ? (
              <div>
                <span className="label">Bukti transfer</span>
                <a href={inv.proofUrl} target="_blank" rel="noreferrer" className="group relative block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={inv.proofUrl} alt="Bukti transfer" className="max-h-72 w-full rounded-xl object-contain ring-1 ring-white/10" />
                  <ExternalLink className="absolute top-2 right-2 size-4 text-white opacity-0 group-hover:opacity-100" />
                </a>
                <p className="mt-1 text-xs text-slate-400">
                  Dikirim {inv.proofUploadedAt && formatDate(inv.proofUploadedAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  {inv.proofNote && ` · “${inv.proofNote}”`}
                </p>
              </div>
            ) : (
              <p className="rounded-xl bg-white/[0.03] px-3 py-2 text-sm text-slate-400">Belum ada bukti transfer dari lembaga.</p>
            )}

            {inv.status === 'MENUNGGU' && (
              <div className="space-y-2 rounded-2xl bg-white/[0.03] p-3 ring-1 ring-white/10">
                <Button className="w-full" loading={busy === 'ok'} onClick={() => run('ok', `/invoices/${inv.id}/verify`, 'POST', { approve: true })}>
                  <Check className="size-4" /> Terima — tandai lunas
                </Button>
                <input className="input" placeholder="Alasan penolakan (wajib bila menolak)" value={reason} onChange={(e) => setReason(e.target.value)} />
                <Button variant="danger" className="w-full" loading={busy === 'no'} disabled={!reason} onClick={() => run('no', `/invoices/${inv.id}/verify`, 'POST', { approve: false, reason })}>
                  <X className="size-4" /> Tolak bukti
                </Button>
              </div>
            )}

            {inv.status === 'BELUM_BAYAR' && (
              <Button variant="secondary" className="w-full" loading={busy === 'paid'} onClick={() => window.confirm('Tandai lunas tanpa bukti (mis. dibayar tunai)?') && run('paid', `/invoices/${inv.id}`, 'PATCH', { status: 'LUNAS' })}>
                <Check className="size-4" /> Tandai lunas manual
              </Button>
            )}
            {(inv.status === 'BELUM_BAYAR' || inv.status === 'MENUNGGU') && (
              <Button variant="ghost" className="w-full" loading={busy === 'cancel'} onClick={() => window.confirm('Batalkan tagihan ini? Tagihan tidak tampil lagi di lembaga.') && run('cancel', `/invoices/${inv.id}`, 'PATCH', { status: 'BATAL' })}>
                <Ban className="size-4" /> Batalkan tagihan
              </Button>
            )}

            <Field label="Catatan untuk lembaga (opsional)">
              <textarea className="input min-h-16" value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
            <Button variant="secondary" size="sm" loading={busy === 'note'} disabled={note === (inv.note ?? '')} onClick={() => run('note', `/invoices/${inv.id}`, 'PATCH', { note: note || null })}>
              Simpan catatan
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
