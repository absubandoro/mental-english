import { LandingHero } from '@/components/LandingHero';
import { serverGet } from '@/lib/server-api';
import type { Branch } from '@/lib/types';

export const dynamic = 'force-dynamic';

/** Landing page: satu section, menu berupa kartu di dalam konten (tanpa header bar) */
export default async function Home() {
  const branches = (await serverGet<Branch[]>('/branches')) ?? [];
  return <LandingHero cities={branches.map((b) => b.city || b.name)} />;
}
