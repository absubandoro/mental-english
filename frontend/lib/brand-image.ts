import 'server-only';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { SERVER_API } from './server-api';

const MIME: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml' };

/**
 * Muat gambar (logo/foto lembaga) sebagai data URL untuk ImageResponse.
 * - "/api/uploads/..." -> ambil langsung dari API (production, lewat path relatif)
 * - "/logo.png"        -> file di folder public
 * - "http(s)://..."    -> unduh
 */
export async function imageDataUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const ext = (url.split('?')[0].split('.').pop() || 'png').toLowerCase();
    let buf: Buffer;
    let type = MIME[ext] || 'image/png';
    if (url.startsWith('/api/')) {
      const res = await fetch(SERVER_API + url.slice(4));
      if (!res.ok) return null;
      type = res.headers.get('content-type') || type;
      buf = Buffer.from(await res.arrayBuffer());
    } else if (url.startsWith('/')) {
      buf = await readFile(join(process.cwd(), 'public', decodeURIComponent(url.split('?')[0])));
    } else if (/^https?:\/\//.test(url)) {
      const res = await fetch(url);
      if (!res.ok) return null;
      type = res.headers.get('content-type') || type;
      buf = Buffer.from(await res.arrayBuffer());
    } else return null;
    if (type.includes('webp') || type.includes('gif')) return null; // tidak didukung ImageResponse
    return `data:${type};base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}
