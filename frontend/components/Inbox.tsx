'use client';

import { Bell, CheckCheck } from 'lucide-react';
import { useState } from 'react';
import { Button, Empty, PageHeader, Pagination, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { useApi } from '@/lib/hooks';

interface InboxData {
  data: { id: string; title: string; body: string; createdAt: string; readAt: string | null }[];
  total: number;
  unread: number;
  page: number;
  limit: number;
}

/** Kotak masuk notifikasi — dipakai semua peran */
export function Inbox({ desc = 'Pengumuman dan info terbaru dari cabang.' }: { desc?: string }) {
  const [page, setPage] = useState(1);
  const { data, loading, reload } = useApi<InboxData>('/notifications', { page });
  const changed = () => {
    reload();
    window.dispatchEvent(new Event('me:notifications'));
  };
  return (
    <>
      <PageHeader
        title="Notifikasi"
        desc={desc}
        action={
          !!data?.unread && (
            <Button
              variant="secondary"
              onClick={async () => {
                await api('/notifications/read-all', { method: 'PATCH' });
                changed();
              }}
            >
              <CheckCheck className="size-4" /> Tandai semua dibaca
            </Button>
          )
        }
      />
      {loading && !data ? (
        <Spinner />
      ) : !data?.data.length ? (
        <Empty icon={<Bell className="size-8" />} title="Belum ada notifikasi" />
      ) : (
        <>
          <ul className="space-y-3">
            {data.data.map((n) => (
              <li key={n.id}>
                <button
                  className={`card w-full p-5 text-left transition ${n.readAt ? 'opacity-70' : 'border-brand-400/30 bg-brand-500/[0.07]'}`}
                  onClick={async () => {
                    if (n.readAt) return;
                    await api(`/notifications/${n.id}/read`, { method: 'PATCH' });
                    changed();
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.readAt ? 'bg-transparent' : 'bg-brand-400'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="font-semibold text-white">{n.title}</h3>
                        <time className="text-xs text-slate-500">{formatDate(n.createdAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</time>
                      </div>
                      <p className="mt-1 text-sm whitespace-pre-line text-slate-300">{n.body}</p>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <Pagination page={data.page} total={data.total} limit={data.limit} onChange={setPage} />
        </>
      )}
    </>
  );
}
