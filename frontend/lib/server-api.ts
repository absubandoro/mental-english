import 'server-only';
import { qs } from './api';

const SERVER_API = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/** Fetch untuk Server Components (halaman publik). Mengembalikan null bila API tidak tersedia. */
export async function serverGet<T>(path: string, query?: Record<string, string | undefined>): Promise<T | null> {
  try {
    const res = await fetch(`${SERVER_API}${path}${qs(query)}`, { next: { revalidate: 30 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
