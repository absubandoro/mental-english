'use client';

import Link from 'next/link';
import { initials, splitName } from '@/lib/org';
import { NofosysMark } from './nofosys/NofosysMark';
import { useOrg } from './OrgProvider';

/** Logo lembaga; bila belum ada logo, tampil inisial dengan warna merek */
export function BrandMark({ size = 40, className = '' }: { size?: number; className?: string }) {
  const org = useOrg();
  if (org.platform && !org.logoUrl) return <NofosysMark size={size} className={className} />;
  if (org.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={org.logoUrl} alt="" width={size} height={size} className={`shrink-0 rounded-full object-cover ${className}`} style={{ width: size, height: size }} />;
  }
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 font-display font-bold text-white ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials(org.name)}
    </span>
  );
}

export function Logo({ size = 40, withText = true, href = '/' }: { size?: number; withText?: boolean; href?: string }) {
  const org = useOrg();
  const [first, rest] = splitName(org.name);
  return (
    <Link href={href} className="inline-flex items-center gap-2.5" aria-label={`${org.name} — beranda`}>
      <BrandMark size={size} />
      {withText && (
        <span className="font-display text-lg leading-none font-bold tracking-tight text-white">
          {first} {rest && <span className="text-brand-300">{rest}</span>}
        </span>
      )}
    </Link>
  );
}
