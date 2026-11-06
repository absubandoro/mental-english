/**
 * Ilustrasi ceria (SVG) untuk kartu blog & mading yang tidak punya gambar.
 * Tanpa 'use client' sehingga bisa dipakai di server maupun client component.
 */

export const PALETTES = [
  { name: 'sky', from: '#2f7fd0', to: '#7dd3fc', paper: '#dbeafe', ink: '#1e3a8a', accent: '#fde047' },
  { name: 'sunshine', from: '#f59e0b', to: '#fde047', paper: '#fef3c7', ink: '#78350f', accent: '#3d8ccf' },
  { name: 'bubblegum', from: '#ec4899', to: '#f9a8d4', paper: '#fce7f3', ink: '#831843', accent: '#fde047' },
  { name: 'mint', from: '#10b981', to: '#6ee7b7', paper: '#dcfce7', ink: '#14532d', accent: '#f472b6' },
  { name: 'grape', from: '#6366f1', to: '#c4b5fd', paper: '#ede9fe', ink: '#3b0764', accent: '#fbbf24' },
  { name: 'coral', from: '#f97316', to: '#fdba74', paper: '#ffedd5', ink: '#7c2d12', accent: '#60a5fa' },
] as const;

export type Palette = (typeof PALETTES)[number];

/** Pilih palet secara konsisten dari sebuah string (id/judul) */
export function paletteFor(seed: string): Palette {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTES[h % PALETTES.length];
}

type Motif = 'speech' | 'book' | 'pencil' | 'star' | 'bulb' | 'play' | 'heart' | 'globe';

/** Motif utama berdasarkan kategori mading / tipe post */
export function motifFor(kind: string): Motif {
  const k = kind.toLowerCase();
  if (k.includes('vlog') || k.includes('video')) return 'play';
  if (k.includes('puisi')) return 'heart';
  if (k.includes('cerita')) return 'book';
  if (k.includes('opini')) return 'bulb';
  if (k.includes('gambar')) return 'star';
  if (k.includes('tulis')) return 'pencil';
  if (k.includes('blog')) return 'speech';
  return 'globe';
}

function MotifShape({ motif, color, accent }: { motif: Motif; color: string; accent: string }) {
  const s = { fill: 'none', stroke: color, strokeWidth: 7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (motif) {
    case 'speech':
      return (
        <g>
          <path d="M-62 -40 h124 a18 18 0 0 1 18 18 v54 a18 18 0 0 1 -18 18 h-70 l-30 26 v-26 h-24 a18 18 0 0 1 -18 -18 v-54 a18 18 0 0 1 18 -18z" fill="#fff" />
          <text x="0" y="12" textAnchor="middle" fontFamily="Oswald, sans-serif" fontWeight="700" fontSize="34" fill={color}>
            Hello!
          </text>
        </g>
      );
    case 'book':
      return (
        <g>
          <path d="M0 -36 C-24 -52 -60 -52 -78 -42 V48 C-60 38 -24 38 0 54 C24 38 60 38 78 48 V-42 C60 -52 24 -52 0 -36z" fill="#fff" />
          <path d="M0 -36 V54" {...s} />
          <path d="M-58 -18 h40 M-58 2 h40 M18 -18 h40 M18 2 h40" {...s} strokeWidth={5} />
        </g>
      );
    case 'pencil':
      return (
        <g transform="rotate(-35)">
          <rect x="-80" y="-18" width="130" height="36" rx="6" fill={accent} />
          <rect x="-80" y="-18" width="22" height="36" rx="6" fill="#fda4af" />
          <path d="M50 -18 L88 0 L50 18 z" fill="#fde68a" />
          <path d="M76 -6 L88 0 L76 6 z" fill="#1e293b" />
        </g>
      );
    case 'star':
      return <path d="M0 -62 L17 -20 L62 -18 L27 10 L39 54 L0 29 L-39 54 L-27 10 L-62 -18 L-17 -20 z" fill="#fff" stroke={color} strokeWidth="6" strokeLinejoin="round" />;
    case 'bulb':
      return (
        <g>
          <circle cx="0" cy="-12" r="44" fill="#fff" />
          <rect x="-20" y="30" width="40" height="26" rx="6" fill={accent} />
          <path d="M-14 -14 q14 22 28 0" {...s} />
          <path d="M-70 -50 l-16 -12 M70 -50 l16 -12 M-78 0 h-20 M78 0 h20" {...s} stroke="#fff" />
        </g>
      );
    case 'play':
      return (
        <g>
          <circle r="54" fill="#fff" />
          <path d="M-16 -26 L30 0 L-16 26 z" fill={color} />
        </g>
      );
    case 'heart':
      return <path d="M0 50 C-70 6 -60 -52 -22 -52 C-8 -52 0 -40 0 -32 C0 -40 8 -52 22 -52 C60 -52 70 6 0 50z" fill="#fff" />;
    default:
      return (
        <g>
          <circle r="52" fill="#fff" />
          <path d="M-52 0 h104 M0 -52 c-30 30 -30 74 0 104 M0 -52 c30 30 30 74 0 104" {...s} />
        </g>
      );
  }
}

/** Doodle kecil yang ditaburkan di latar */
function Sprinkles({ color }: { color: string }) {
  const star = (x: number, y: number, r: number) =>
    `M${x} ${y - r} L${x + r * 0.28} ${y - r * 0.28} L${x + r} ${y} L${x + r * 0.28} ${y + r * 0.28} L${x} ${y + r} L${x - r * 0.28} ${y + r * 0.28} L${x - r} ${y} L${x - r * 0.28} ${y - r * 0.28} z`;
  return (
    <g fill={color} opacity="0.9">
      <path d={star(46, 40, 12)} />
      <path d={star(350, 52, 9)} />
      <path d={star(330, 180, 13)} />
      <circle cx="70" cy="190" r="6" />
      <circle cx="300" cy="28" r="4" />
      <circle cx="28" cy="120" r="4" />
      <path d="M360 110 q10 -10 20 0 t20 0" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M18 230 q10 -10 20 0 t20 0" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
    </g>
  );
}

export function CoverArt({ seed, kind, className = '' }: { seed: string; kind: string; className?: string }) {
  const p = paletteFor(seed);
  const id = `g-${p.name}-${seed.replace(/[^a-z0-9]/gi, '').slice(0, 10)}`;
  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={p.from} />
          <stop offset="1" stopColor={p.to} />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill={`url(#${id})`} />
      <circle cx="340" cy="230" r="90" fill="#fff" opacity="0.14" />
      <circle cx="40" cy="-10" r="70" fill="#fff" opacity="0.12" />
      <Sprinkles color={p.accent} />
      <g transform="translate(200 122)">
        <MotifShape motif={motifFor(kind)} color={p.from} accent={p.accent} />
      </g>
    </svg>
  );
}

/** Kumpulan doodle untuk header halaman */
export function DoodleCluster({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 420 260" className={className} aria-hidden>
      <g transform="translate(110 92) rotate(-8)">
        <path d="M-80 -46 h160 a20 20 0 0 1 20 20 v62 a20 20 0 0 1 -20 20 h-92 l-34 28 v-28 h-34 a20 20 0 0 1 -20 -20 v-62 a20 20 0 0 1 20 -20z" fill="#fde047" />
        <text x="0" y="14" textAnchor="middle" fontFamily="Oswald, sans-serif" fontWeight="700" fontSize="36" fill="#78350f">
          Let&apos;s speak!
        </text>
      </g>
      <g transform="translate(320 70) rotate(12)">
        <path d="M0 -44 L12 -14 L44 -13 L19 7 L28 39 L0 21 L-28 39 L-19 7 L-44 -13 L-12 -14 z" fill="#f472b6" />
      </g>
      <g transform="translate(300 190) rotate(6)">
        <path d="M-70 -34 h140 a16 16 0 0 1 16 16 v42 a16 16 0 0 1 -16 16 h-30 l26 24 -52 -24 h-84 a16 16 0 0 1 -16 -16 v-42 a16 16 0 0 1 16 -16z" fill="#6ee7b7" />
        <text x="0" y="10" textAnchor="middle" fontFamily="Oswald, sans-serif" fontWeight="700" fontSize="28" fill="#14532d">
          You can do it!
        </text>
      </g>
      <g transform="translate(110 210) rotate(-30)">
        <rect x="-60" y="-13" width="100" height="26" rx="5" fill="#60a5fa" />
        <path d="M40 -13 L68 0 L40 13 z" fill="#fde68a" />
        <path d="M60 -4 L68 0 L60 4 z" fill="#1e293b" />
      </g>
      <circle cx="225" cy="28" r="8" fill="#fbbf24" />
      <circle cx="30" cy="190" r="6" fill="#a78bfa" />
      <circle cx="400" cy="140" r="5" fill="#fde047" />
    </svg>
  );
}
