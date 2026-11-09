'use client';

import { CalendarView } from '@/components/CalendarView';

export default function Page() {
  return <CalendarView editable desc="Buat agenda cabang (libur, acara, ujian). Jadwal kelas mingguan tampil otomatis dan ditandai libur bila bentrok dengan agenda libur." />;
}
