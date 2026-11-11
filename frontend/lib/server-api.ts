import 'server-only';
import { headers } from 'next/headers';
import { qs } from './api';

export const SERVER_API = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/** Domain yang dibuka pengunjung — diteruskan ke API agar lembaga (organisasi) dikenali */
export async function tenantHost() {
  const h = await headers();
  return h.get('x-forwarded-host') || h.get('host') || '';
}

/** Fetch untuk Server Components (halaman publik). Mengembalikan null bila API tidak tersedia. */
export async function serverGet<T>(path: string, query?: Record<string, string | undefined>): Promise<T | null> {
  try {
    const res = await fetch(`${SERVER_API}${path}${qs(query)}`, { cache: 'no-store', headers: { 'x-tenant-host': await tenantHost() } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
