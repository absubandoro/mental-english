'use client';

import { useId } from 'react';
import { NOFOSYS_FROM, NOFOSYS_TO } from '@/lib/nofosys-mark';

/** Logo Nofosys (lihat lib/nofosys-mark.ts) */
export function NofosysMark({ size = 40, className = '' }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={`shrink-0 ${className}`} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor={NOFOSYS_FROM} />
          <stop offset="1" stopColor={NOFOSYS_TO} />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${id})`} />
      <path d="M19 45V19L45 45V19" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="19" cy="45" r="5" fill="#fff" />
      <circle cx="45" cy="19" r="5" fill="#fff" />
      <circle cx="19" cy="19" r="3.2" fill="#fff" fillOpacity=".75" />
      <circle cx="45" cy="45" r="3.2" fill="#fff" fillOpacity=".75" />
    </svg>
  );
}
