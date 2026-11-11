'use client';

import { CalendarCheck, CreditCard, GraduationCap, KeyRound, Newspaper, Palette, ReceiptText, School, UserPlus, Users, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { useBranchScope } from '@/components/admin';
import { Badge, PageHeader, Spinner, Stat } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { formatDate, rupiah, SESSION_TYPE_LABEL } from '@/lib/format';
import { periodName, type SubscriptionInfo } from '@/components/SystemInvoice';
import { useApi } from '@/lib/hooks';
import { SESSION_TONE } from '@/lib/tones';
import type { ClassSessionSummary, Paged } from '@/lib/types';

interface Stats {
  students: number;
  parents: number;
  teachers: number;
  classes: number;
  posts: number;
  mading: number;
  unpaid: number;
  sessions: number;
  pendingPayments: number;
  newEnrollments: number;
}

export default function AdminHome() {
  const { user } = useAuth();
  const { branchId } = useBranchScope();
  const { data } = useApi<Stats>('/admin/stats', { branchId });
  const { data: sessions } = useApi<Paged<ClassSessionSummary>>('/admin/sessions', { branchId, limit: 8 });
  // Tagihan langganan sistem (khusus Super Admin)
  const { data: sub } = useApi<SubscriptionInfo>(user?.role === 'SUPER_ADMIN' ? '/admin/subscription' : null);
  const due = sub?.invoices.find((i) => i.status === 'BELUM_BAYAR');

  const cards = data && [
    { label: 'Perlu verifikasi bayar', value: data.pendingPayments, icon: ReceiptText, href: '/admin/pembayaran' },
    { label: 'Pendaftaran baru', value: data.newEnrollments, icon: UserPlus, href: '/admin/pendaftaran' },
    { label: 'Pelajar', value: data.students, icon: GraduationCap, href: '/admin/pelajar' },
    { label: 'Orang tua', value: data.parents, icon: UsersRound, href: '/admin/orang-tua' },
    { label: 'Pengajar', value: data.teachers, icon: Users, href: '/admin/pengajar' },
    { label: 'Kelas', value: data.classes, icon: School, href: '/admin/kelas' },
    { label: 'Pertemuan', value: data.sessions, icon: CalendarCheck, href: '/admin' },
    { label: 'Blog & vlog', value: data.posts, icon: Newspaper, href: '/admin/blog' },
    { label: 'Mading', value: data.mading, icon: Palette, href: '/admin/mading' },
    { label: 'Tagihan belum bayar', value: data.unpaid, icon: CreditCard, href: '/admin/pembayaran' },
  ];

  return (
    <>
      <PageHeader title={`Halo, ${user?.name.split(' ')[0]} 👋`} desc={user?.role === 'SUPER_ADMIN' ? 'Ringkasan seluruh cabang (atau cabang yang dipilih).' : `Ringkasan ${user?.branch?.name ?? 'cabang Anda'}.`} />
      {due && sub && (
        <Link
          href="/admin/langganan"
          className={`mb-5 flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm ring-1 transition ${
            due.dueDate < sub.today ? 'bg-rose-500/10 text-rose-100 ring-rose-400/30 hover:bg-rose-500/15' : 'bg-amber-500/10 text-amber-100 ring-amber-400/30 hover:bg-amber-500/15'
          }`}
        >
          <KeyRound className="size-5 shrink-0" />
          <span className="flex-1">
            <b>Tagihan langganan sistem {periodName(due.period)}</b> sebesar {rupiah(due.amount)} {due.dueDate < sub.today ? 'sudah lewat' : ''} jatuh tempo{' '}
            {formatDate(due.dueDate)}.
          </span>
          <span className="shrink-0 font-semibold underline-offset-2 hover:underline">Bayar</span>
        </Link>
      )}
      {!cards ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {cards.map((c, i) => (
            <Link key={c.label} href={c.href}>
              <Stat label={c.label} value={c.value} icon={<c.icon className="size-5" />} tone={i % 2 ? 'from-navy-500/40' : 'from-brand-500/20'} />
            </Link>
          ))}
        </div>
      )}

      <section className="card mt-8 overflow-hidden">
        <h2 className="p-5 pb-3 font-display text-lg font-bold text-white">Pertemuan kelas terbaru</h2>
        {!sessions?.data.length ? (
          <p className="px-5 pb-5 text-sm text-slate-400">Belum ada pertemuan.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {sessions.data.map((s) => (
              <li key={s.id}>
                <Link href={`/admin/sesi/${s.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 hover:bg-white/[0.03]">
                  <span className="w-24 text-sm text-slate-400">{formatDate(s.date, { day: 'numeric', month: 'short' })}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-white">{s.topic}</div>
                    <div className="text-xs text-slate-500">
                      {s.classRoom.name} · {s.teacher.name}
                    </div>
                  </div>
                  <Badge tone={SESSION_TONE[s.type]}>{SESSION_TYPE_LABEL[s.type]}</Badge>
                  <span className="text-xs text-slate-400">
                    Hadir {s.presentCount}/{s.attendanceCount}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
