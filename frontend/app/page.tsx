import { LandingHero } from '@/components/LandingHero';
import { PlatformLanding } from '@/components/PlatformLanding';
import { getOrg } from '@/lib/org-server';
import { serverGet } from '@/lib/server-api';
import type { Branch } from '@/lib/types';

export const dynamic = 'force-dynamic';

/** Domain lembaga: landing lembaga (satu section, menu berupa kartu). Domain platform: website produk Nofosys. */
export default async function Home() {
  const org = await getOrg();
  if (org.platform) return <PlatformLanding org={org} />;
  const branches = (await serverGet<Branch[]>('/branches')) ?? [];
  return <LandingHero cities={branches.map((b) => b.city || b.name)} />;
}
