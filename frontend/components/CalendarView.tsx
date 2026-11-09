'use client';

import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock, MapPin, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { addDays, EVENT_TYPE_LABEL, formatDate, isoDate, SESSION_TYPE_LABEL, today } from '@/lib/format';
import { useApi } from '@/lib/hooks';
import { EVENT_TONE } from '@/lib/tones';
import type { CalendarData, CalendarEvent, CalendarEventType, ClassOccurrence, ClassRoom } from '@/lib/types';
import { BranchNotice, useBranchScope } from './admin';
import { Badge, Button, confirmDelete, ErrorBox, Field, Modal, PageHeader, Spinner, Tabs } from './ui';

const WEEK = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const EVENT_DOT: Record<CalendarEventType, string> = {
  LIBUR: 'bg-rose-500/20 text-rose-200 ring-rose-400/30',
  ACARA: 'bg-brand-500/20 text-brand-100 ring-brand-400/30',
  UJIAN: 'bg-amber-500/20 text-amber-100 ring-amber-400/30',
  LAINNYA: 'bg-white/10 text-slate-200 ring-white/15',
};

type DayItems = { events: CalendarEvent[]; classes: ClassOccurrence[] };
const EMPTY_FORM = { title: '', type: 'ACARA' as CalendarEventType, startDate: today(), endDate: '', startTime: '', endTime: '', classId: '', description: '', notify: true };

function monthGrid(month: string) {
  const first = `${month}-01`;
  const dow = (new Date(first + 'T00:00:00').getDay() + 6) % 7;
  const start = addDays(first, -dow);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

function timeRange(a: string | null, b: string | null) {
  if (!a) return '';
  return b ? `${a}–${b}` : a;
}

export function CalendarView({ title = 'Kalender', desc, editable = false }: { title?: string; desc?: string; editable?: boolean }) {
  const { user } = useAuth();
  const scope = useBranchScope();
  const [month, setMonth] = useState(today().slice(0, 7));
  const [classId, setClassId] = useState('');
  const [mine, setMine] = useState<'mine' | 'all'>('mine');
  const days = useMemo(() => monthGrid(month), [month]);
  const isTeacher = user?.role === 'TEACHER';
  const { data, loading, reload } = useApi<CalendarData>('/calendar', {
    from: days[0],
    to: days[41],
    classId,
    mine: isTeacher && mine === 'mine' ? 'true' : undefined,
    branchId: scope.branchId,
  });
  const classPath = user?.role === 'TEACHER' ? '/teacher/classes' : user && ['ADMIN', 'SUPER_ADMIN'].includes(user.role) ? '/admin/classes' : null;
  const { data: classList } = useApi<ClassRoom[]>(classPath, { branchId: scope.branchId });
  const classes = useMemo(() => {
    if (classList) return classList.map((c) => ({ id: c.id, name: c.name }));
    const m = new Map<string, string>();
    data?.occurrences.forEach((o) => m.set(o.classId, o.className));
    return [...m.entries()].map(([id, name]) => ({ id, name }));
  }, [classList, data]);

  const byDay = useMemo(() => {
    const map = new Map<string, DayItems>();
    for (const d of days) map.set(d, { events: [], classes: [] });
    data?.events.forEach((e) => {
      for (let d = e.startDate; d <= e.endDate; d = addDays(d, 1)) map.get(d)?.events.push(e);
    });
    data?.occurrences.forEach((o) => map.get(o.date)?.classes.push(o));
    return map;
  }, [data, days]);

  const [day, setDay] = useState<string | null>(null);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openForm = (e?: CalendarEvent, date?: string) => {
    setEditing(e ?? null);
    setError(null);
    setForm(
      e
        ? {
            title: e.title,
            type: e.type,
            startDate: e.startDate,
            endDate: e.endDate,
            startTime: e.startTime ?? '',
            endTime: e.endTime ?? '',
            classId: e.classId ?? '',
            description: e.description ?? '',
            notify: false,
          }
        : { ...EMPTY_FORM, startDate: date ?? today() },
    );
    setDay(null);
    setFormOpen(true);
  };

  const save = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    setError(null);
    const body = {
      ...form,
      endDate: form.endDate || form.startDate,
      startTime: form.startTime || null,
      endTime: form.endTime || null,
      classId: form.classId || null,
      description: form.description || undefined,
      notify: editing ? undefined : form.notify,
      branchId: editing ? undefined : scope.branchId,
    };
    try {
      await api(editing ? `/admin/calendar/${editing.id}` : '/admin/calendar', { method: editing ? 'PATCH' : 'POST', body });
      setFormOpen(false);
      reload();
    } catch (er) {
      setError((er as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const shift = (n: number) => {
    const [y, m] = month.split('-').map(Number);
    setMonth(isoDate(new Date(y, m - 1 + n, 1)).slice(0, 7));
  };
  const monthLabel = new Date(`${month}-01T00:00:00`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const now = today();
  const agenda = days.filter((d) => d.startsWith(month)).filter((d) => {
    const it = byDay.get(d)!;
    return it.events.length || it.classes.length;
  });

  const occLabel = (o: ClassOccurrence) => `${o.startTime ? o.startTime + ' ' : ''}${o.className}`;

  const OccurrenceRow = ({ o }: { o: ClassOccurrence }) => (
    <div className={`flex items-start gap-3 rounded-xl px-3 py-2.5 ring-1 ring-white/10 ${o.holiday ? 'bg-rose-500/5 opacity-70' : 'bg-white/[0.03]'}`}>
      <div className="w-14 shrink-0 pt-0.5 text-xs font-semibold text-brand-200">{o.startTime ?? '—'}</div>
      <div className="min-w-0 flex-1">
        <div className={`font-medium text-white ${o.holiday ? 'line-through' : ''}`}>{o.className}</div>
        <div className="text-xs text-slate-400">
          {timeRange(o.startTime, o.endTime)}
          {o.room && ` · ${o.room}`}
          {o.teachers.length > 0 && ` · ${o.teachers.join(', ')}`}
        </div>
        {o.holiday && <div className="mt-1 text-xs text-rose-300">Libur: {o.holidayTitle}</div>}
        {o.extra && <div className="mt-1 text-xs text-amber-200">Kelas tambahan</div>}
        {o.session && (
          <div className="mt-1 flex items-center gap-1 text-xs text-emerald-300">
            <CheckCircle2 className="size-3.5" /> {SESSION_TYPE_LABEL[o.session.type]}: {o.session.topic}
          </div>
        )}
      </div>
      {isTeacher && !o.holiday && (
        <div className="shrink-0">
          {o.session ? (
            <Link href={`/pengajar/sesi/${o.session.id}`} className="rounded-lg bg-white/10 px-2.5 py-1.5 text-xs text-white hover:bg-white/15">
              Buka
            </Link>
          ) : o.date <= now ? (
            <Link href={`/pengajar/sesi?kelas=${o.classId}&tanggal=${o.date}`} className="rounded-lg bg-brand-500 px-2.5 py-1.5 text-xs text-white hover:bg-brand-400">
              Isi absensi
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );

  const EventRow = ({ e }: { e: CalendarEvent }) => (
    <button
      type="button"
      disabled={!editable}
      onClick={() => openForm(e)}
      className={`w-full rounded-xl px-3 py-2.5 text-left ring-1 ${EVENT_DOT[e.type]} ${editable ? 'hover:brightness-125' : 'cursor-default'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{e.title}</span>
        <Badge tone={EVENT_TONE[e.type]}>{EVENT_TYPE_LABEL[e.type]}</Badge>
      </div>
      <div className="mt-0.5 text-xs opacity-80">
        {e.startDate !== e.endDate ? `${formatDate(e.startDate, { day: 'numeric', month: 'short' })} – ${formatDate(e.endDate, { day: 'numeric', month: 'short' })}` : ''}
        {e.startTime && ` ${timeRange(e.startTime, e.endTime)}`}
        {e.classRoom ? ` · ${e.classRoom.name}` : ' · Seluruh cabang'}
      </div>
      {e.description && <div className="mt-1 text-xs opacity-80">{e.description}</div>}
    </button>
  );

  return (
    <>
      <PageHeader
        title={title}
        desc={desc ?? 'Agenda cabang dan jadwal kelas. Jadwal kelas otomatis mengikuti jadwal mingguan tiap kelas.'}
        action={
          editable && (
            <Button onClick={() => openForm()} disabled={scope.needBranch}>
              <Plus className="size-4" /> Tambah agenda
            </Button>
          )
        }
      />
      {editable && <BranchNotice />}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => shift(-1)} className="rounded-xl border border-white/10 p-2 text-slate-300 hover:bg-white/5" aria-label="Bulan sebelumnya">
            <ChevronLeft className="size-5" />
          </button>
          <h2 className="min-w-40 text-center font-display text-xl font-bold text-white capitalize">{monthLabel}</h2>
          <button onClick={() => shift(1)} className="rounded-xl border border-white/10 p-2 text-slate-300 hover:bg-white/5" aria-label="Bulan berikutnya">
            <ChevronRight className="size-5" />
          </button>
          {month !== now.slice(0, 7) && (
            <Button variant="ghost" size="sm" onClick={() => setMonth(now.slice(0, 7))}>
              Hari ini
            </Button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isTeacher && (
            <Tabs
              value={mine}
              onChange={setMine}
              items={[
                { value: 'mine', label: 'Kelas saya' },
                { value: 'all', label: 'Semua kelas' },
              ]}
            />
          )}
          {classes.length > 1 && (
            <select className="input w-auto py-2" value={classId} onChange={(e) => setClassId(e.target.value)} aria-label="Filter kelas">
              <option value="">Semua kelas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-brand-400" /> Jadwal kelas
        </span>
        {(['LIBUR', 'ACARA', 'UJIAN'] as CalendarEventType[]).map((t) => (
          <span key={t} className="flex items-center gap-1.5">
            <span className={`size-2.5 rounded-full ${t === 'LIBUR' ? 'bg-rose-400' : t === 'UJIAN' ? 'bg-amber-400' : 'bg-sky-300'}`} /> {EVENT_TYPE_LABEL[t]}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="size-3.5 text-emerald-300" /> Absensi sudah diisi
        </span>
      </div>

      {loading && !data ? (
        <Spinner />
      ) : (
        <>
          {/* Desktop: grid bulan */}
          <div className="hidden overflow-hidden rounded-2xl border border-white/10 md:block">
            <div className="grid grid-cols-7 bg-white/[0.03] text-center text-xs font-semibold text-slate-400">
              {WEEK.map((w) => (
                <div key={w} className="py-2">
                  {w}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((d) => {
                const it = byDay.get(d)!;
                const inMonth = d.startsWith(month);
                const items = [
                  ...it.events.map((e) => ({ key: e.id, cls: EVENT_DOT[e.type], label: e.title, done: false })),
                  ...it.classes.map((o, i) => ({
                    key: `${o.classId}${i}`,
                    cls: o.holiday ? 'bg-white/5 text-slate-500 line-through ring-white/5' : 'bg-brand-500/10 text-brand-100 ring-brand-400/20',
                    label: occLabel(o),
                    done: !!o.session,
                  })),
                ];
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDay(d)}
                    className={`min-h-28 border-t border-r border-white/5 p-1.5 text-left align-top transition hover:bg-white/[0.04] [&:nth-child(7n)]:border-r-0 ${inMonth ? '' : 'opacity-40'}`}
                  >
                    <span
                      className={`mb-1 inline-flex size-6 items-center justify-center rounded-full text-xs ${d === now ? 'bg-brand-500 font-bold text-white' : 'text-slate-300'}`}
                    >
                      {Number(d.slice(8))}
                    </span>
                    <div className="space-y-0.5">
                      {items.slice(0, 3).map((x) => (
                        <div key={x.key} className={`flex items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-[11px] ring-1 ${x.cls}`}>
                          {x.done && <CheckCircle2 className="size-3 shrink-0 text-emerald-300" />}
                          <span className="truncate">{x.label}</span>
                        </div>
                      ))}
                      {items.length > 3 && <div className="px-1.5 text-[11px] text-slate-500">+{items.length - 3} lagi</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* HP: daftar agenda */}
          <div className="space-y-4 md:hidden">
            {agenda.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center text-sm text-slate-400">
                <CalendarDays className="mx-auto mb-2 size-7 text-brand-300" /> Tidak ada agenda bulan ini.
              </div>
            )}
            {agenda.map((d) => {
              const it = byDay.get(d)!;
              return (
                <section key={d}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`flex size-10 flex-col items-center justify-center rounded-xl text-white ${d === now ? 'bg-brand-500' : 'bg-white/5 ring-1 ring-white/10'}`}>
                      <span className="font-display text-base leading-none font-bold">{Number(d.slice(8))}</span>
                    </span>
                    <span className="text-sm font-semibold text-slate-200">
                      {formatDate(d, { weekday: 'long', day: 'numeric', month: 'long' })}
                      {d === now && <span className="ml-2 text-xs text-brand-300">Hari ini</span>}
                    </span>
                    {editable && (
                      <button onClick={() => openForm(undefined, d)} className="ml-auto rounded-lg p-1.5 text-slate-400 hover:text-white" aria-label="Tambah agenda di tanggal ini">
                        <Plus className="size-4" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {it.events.map((e) => (
                      <EventRow key={e.id} e={e} />
                    ))}
                    {it.classes.map((o, i) => (
                      <OccurrenceRow key={o.classId + i} o={o} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}

      {/* Detail tanggal (desktop) */}
      <Modal open={!!day} onClose={() => setDay(null)} title={day ? formatDate(day, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}>
        {day && (
          <div className="space-y-2">
            {byDay.get(day)?.events.map((e) => (
              <EventRow key={e.id} e={e} />
            ))}
            {byDay.get(day)?.classes.map((o, i) => (
              <OccurrenceRow key={o.classId + i} o={o} />
            ))}
            {!byDay.get(day)?.events.length && !byDay.get(day)?.classes.length && <p className="py-6 text-center text-sm text-slate-400">Tidak ada agenda.</p>}
            {editable && (
              <Button variant="secondary" className="mt-2 w-full" onClick={() => openForm(undefined, day)}>
                <Plus className="size-4" /> Tambah agenda di tanggal ini
              </Button>
            )}
          </div>
        )}
      </Modal>

      {/* Form agenda (admin) */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Ubah agenda' : 'Agenda baru'}>
        <form className="space-y-4" onSubmit={save}>
          <ErrorBox message={error} />
          <Field label="Judul">
            <input className="input" required minLength={2} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="mis. Libur Idul Fitri, Speaking Day" />
          </Field>
          <div>
            <span className="label">Jenis</span>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(EVENT_TYPE_LABEL) as CalendarEventType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, type: t })}
                  className={`rounded-xl px-2 py-2 text-xs font-semibold ring-1 transition ${form.type === t ? EVENT_DOT[t] + ' ring-2' : 'text-slate-400 ring-white/10 hover:text-white'}`}
                >
                  {EVENT_TYPE_LABEL[t]}
                </button>
              ))}
            </div>
            {form.type === 'LIBUR' && <p className="mt-1.5 text-xs text-rose-200">Jadwal kelas pada tanggal ini otomatis ditandai libur.</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tanggal mulai">
              <input className="input" type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </Field>
            <Field label="Tanggal selesai">
              <input className="input" type="date" min={form.startDate} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </Field>
            <Field label="Jam mulai (opsional)">
              <input className="input" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </Field>
            <Field label="Jam selesai">
              <input className="input" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </Field>
          </div>
          <Field label="Berlaku untuk">
            <select className="input" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
              <option value="">Seluruh cabang</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Kelas {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Keterangan">
            <textarea className="input min-h-20" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          {!editing && (
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" className="size-4 accent-brand-500" checked={form.notify} onChange={(e) => setForm({ ...form, notify: e.target.checked })} />
              Kirim notifikasi ke orang tua
            </label>
          )}
          <div className="flex justify-between gap-2 pt-2">
            {editing ? (
              <Button
                type="button"
                variant="danger"
                onClick={async () => {
                  if (!confirmDelete(`agenda "${editing.title}"`)) return;
                  await api(`/admin/calendar/${editing.id}`, { method: 'DELETE' });
                  setFormOpen(false);
                  reload();
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
                Batal
              </Button>
              <Button type="submit" loading={busy}>
                Simpan
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}

/** Ringkas: jadwal kelas hari ini (dipakai di halaman Kelas Hari Ini pengajar) */
export function TodaySchedule() {
  const now = today();
  const { data } = useApi<CalendarData>('/calendar', { from: now, to: now, mine: 'true' });
  const occ = data?.occurrences ?? [];
  const holidays = data?.events.filter((e) => e.type === 'LIBUR') ?? [];
  if (!data || (!occ.length && !holidays.length)) return null;
  return (
    <section className="mb-6">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-300">
        <Clock className="size-4 text-brand-300" /> Jadwal saya hari ini
      </h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {occ.map((o, i) => (
          <div key={o.classId + i} className={`flex items-center gap-3 rounded-2xl p-3 ring-1 ring-white/10 ${o.holiday ? 'bg-rose-500/5' : 'bg-gradient-to-r from-brand-500/15 to-transparent'}`}>
            <div className="w-16 shrink-0 text-center">
              <div className="font-display text-lg font-bold text-white">{o.startTime}</div>
              <div className="text-[11px] text-slate-400">{o.endTime}</div>
            </div>
            <div className="min-w-0 flex-1">
              <div className={`truncate font-semibold text-white ${o.holiday ? 'line-through' : ''}`}>{o.className}</div>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                {o.holiday ? (
                  <span className="text-rose-300">Libur: {o.holidayTitle}</span>
                ) : (
                  <>
                    <MapPin className="size-3" /> {o.room ?? '-'}
                  </>
                )}
              </div>
            </div>
            {!o.holiday &&
              (o.session ? (
                <Link href={`/pengajar/sesi/${o.session.id}`} className="shrink-0 rounded-xl bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-200">
                  <CheckCircle2 className="mr-1 inline size-3.5" /> Terisi
                </Link>
              ) : (
                <Link href={`/pengajar/sesi?kelas=${o.classId}`} className="shrink-0 rounded-xl bg-brand-500 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-400">
                  Mulai kelas
                </Link>
              ))}
          </div>
        ))}
      </div>
    </section>
  );
}
