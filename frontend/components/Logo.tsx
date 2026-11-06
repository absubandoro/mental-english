import Image from 'next/image';
import Link from 'next/link';

export function Logo({ size = 40, withText = true, href = '/' }: { size?: number; withText?: boolean; href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5" aria-label="Mental English — beranda">
      <Image src="/logo.png" alt="" width={size} height={size} className="rounded-full" priority />
      {withText && (
        <span className="font-display text-lg leading-none font-bold tracking-tight text-white">
          Mental <span className="text-brand-300">English</span>
        </span>
      )}
    </Link>
  );
}
