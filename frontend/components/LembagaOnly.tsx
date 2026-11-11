'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useOrg } from './OrgProvider';

/** Halaman portal lembaga tidak ada di domain platform Nofosys — arahkan ke beranda platform */
export function LembagaOnly() {
  const org = useOrg();
  const router = useRouter();
  useEffect(() => {
    if (org.platform) router.replace('/');
  }, [org.platform, router]);
  return null;
}
