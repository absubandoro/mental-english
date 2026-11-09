'use client';

import { Plus, Trash2 } from 'lucide-react';
import { DAY_NAMES } from '@/lib/format';
import type { ClassSchedule } from '@/lib/types';
import { Button } from './ui';

/** Urutan hari Senin..Minggu */
const ORDER = [1, 2, 3, 4, 5, 6, 0];

/** Editor slot jadwal mingguan kelas (tersinkron ke kalender) */
export function ScheduleEditor({ value, onChange }: { value: ClassSchedule[]; onChange: (v: ClassSchedule[]) => void }) {
  const set = (i: number, patch: Partial<ClassSchedule>) => onChange(value.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  return (
    <div>
      <span className="label">Jadwal mingguan</span>
      <div className="space-y-2">
        {value.map((s, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 rounded-xl bg-white/[0.03] p-2 ring-1 ring-white/10">
            <select className="input w-auto min-w-28 flex-1 py-2" value={s.dayOfWeek} onChange={(e) => set(i, { dayOfWeek: Number(e.target.value) })} aria-label="Hari">
              {ORDER.map((d) => (
                <option key={d} value={d}>
                  {DAY_NAMES[d]}
                </option>
              ))}
            </select>
            <input className="input w-32 py-2" type="time" required value={s.startTime} onChange={(e) => set(i, { startTime: e.target.value })} aria-label="Jam mulai" />
            <span className="text-slate-500">–</span>
            <input className="input w-32 py-2" type="time" required value={s.endTime} onChange={(e) => set(i, { endTime: e.target.value })} aria-label="Jam selesai" />
            <input className="input w-auto min-w-32 flex-1 py-2" placeholder="Ruang (opsional)" value={s.room ?? ''} onChange={(e) => set(i, { room: e.target.value })} aria-label="Ruang" />
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="rounded-lg p-2 text-slate-400 hover:text-rose-300" aria-label="Hapus slot">
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="mt-2"
        onClick={() => onChange([...value, { dayOfWeek: value.length ? (value[value.length - 1].dayOfWeek + 2) % 7 : 1, startTime: value[0]?.startTime ?? '15:30', endTime: value[0]?.endTime ?? '17:00', room: value[0]?.room ?? '' }])}
      >
        <Plus className="size-3.5" /> Tambah hari
      </Button>
      <p className="mt-1.5 text-xs text-slate-500">Jadwal ini otomatis tampil di kalender pengajar, pelajar, dan orang tua.</p>
    </div>
  );
}
