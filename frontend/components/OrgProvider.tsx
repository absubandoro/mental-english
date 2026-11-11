'use client';

import { createContext, useContext } from 'react';
import { FALLBACK_ORG, type Org } from '@/lib/org';

const OrgContext = createContext<Org>(FALLBACK_ORG);

export function OrgProvider({ org, children }: { org: Org; children: React.ReactNode }) {
  return <OrgContext.Provider value={org}>{children}</OrgContext.Provider>;
}

/** Identitas lembaga yang sedang dibuka (nama, logo, warna, foto, kontak) */
export function useOrg() {
  return useContext(OrgContext);
}
