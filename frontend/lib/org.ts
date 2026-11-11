/** Identitas lembaga (organisasi) dari domain yang dibuka — dipakai di server & browser */
export interface Org {
  id: string;
  /** true = domain platform Nofosys (website produk & panel pengelola), bukan lembaga */
  platform?: boolean;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  logoUrl: string | null;
  brandColor: string;
  photos: { welcome?: string | null; holiday?: string | null; team?: string | null };
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
  website: string | null;
}

/** Dipakai bila API tidak bisa dihubungi */
export const FALLBACK_ORG: Org = {
  id: '',
  slug: '',
  name: 'Portal Kursus',
  tagline: null,
  description: null,
  logoUrl: null,
  brandColor: '#3d8ccf',
  photos: {},
  whatsapp: null,
  email: null,
  instagram: null,
  website: null,
};

/** "Mental English" -> ["Mental", "English"]; "Bimbel" -> ["Bimbel", ""] */
export function splitName(name: string): [string, string] {
  const i = name.indexOf(' ');
  return i < 0 ? [name, ''] : [name.slice(0, i), name.slice(i + 1)];
}

export function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join('') || '?'
  );
}

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  const n = parseInt(m ? m[1] : '3d8ccf', 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const toHex = (c: number[]) => '#' + c.map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('');
const mix = (a: number[], b: number[], t: number) => a.map((x, i) => x + (b[i] - x) * t);

/** Gradasi warna merek (50–600) dari satu warna utama */
export function brandShades(hex: string): Record<string, string> {
  const c = hexToRgb(hex);
  const W = [255, 255, 255];
  const K = [0, 0, 0];
  return {
    50: toHex(mix(c, W, 0.92)),
    100: toHex(mix(c, W, 0.82)),
    200: toHex(mix(c, W, 0.62)),
    300: toHex(mix(c, W, 0.4)),
    400: toHex(mix(c, W, 0.18)),
    500: toHex(c),
    600: toHex(mix(c, K, 0.18)),
  };
}

/** CSS yang menimpa warna merek bawaan (variabel tema Tailwind) */
export function brandCss(hex: string) {
  const s = brandShades(hex);
  const [r, g, b] = hexToRgb(hex);
  return `:root{${Object.entries(s)
    .map(([k, v]) => `--color-brand-${k}:${v};`)
    .join('')}--brand-rgb:${r} ${g} ${b};}`;
}

/** Link WhatsApp dari nomor lokal (08xx -> 628xx) */
export function waLink(phone: string, text = '') {
  return `https://wa.me/${phone.replace(/\D/g, '').replace(/^0/, '62')}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
