import type { BadgeTone } from '@/components/ui';
import type { AttendanceStatus, PaymentStatus, SessionType } from './types';

export const ATT_TONE: Record<AttendanceStatus, BadgeTone> = { HADIR: 'green', IZIN: 'blue', SAKIT: 'amber', ALPA: 'red' };
export const PAY_TONE: Record<PaymentStatus, BadgeTone> = { LUNAS: 'green', MENUNGGU: 'amber', BELUM_BAYAR: 'red' };
export const SESSION_TONE: Record<SessionType, BadgeTone> = { BELAJAR: 'blue', UJIAN: 'amber', OUTDOOR: 'green' };
