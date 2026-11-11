import { ImageResponse } from 'next/og';
import { imageDataUrl } from '@/lib/brand-image';
import { getOrg } from '@/lib/org-server';
import { nofosysMarkDataUrl } from '@/lib/nofosys-mark';
import { brandShades, initials } from '@/lib/org';

/** Ikon lembaga (favicon, ikon aplikasi HP): logo, atau inisial dengan warna merek. ?size=192&maskable=1 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const size = Math.min(1024, Math.max(16, Number(searchParams.get('size')) || 192));
  const maskable = searchParams.get('maskable') === '1';
  const org = await getOrg();
  const logo = org.platform && !org.logoUrl ? nofosysMarkDataUrl(512) : await imageDataUrl(org.logoUrl);
  const s = brandShades(org.brandColor);
  // Ikon maskable: beri ruang aman di tepi (Android memotong jadi lingkaran/rounded)
  const inner = maskable ? Math.round(size * 0.72) : size;

  const res = new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: maskable || !logo ? `linear-gradient(135deg, ${s[400]}, ${s[600]})` : 'transparent',
          borderRadius: maskable ? 0 : logo ? 0 : size / 2,
        }}
      >
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} width={inner} height={inner} style={{ borderRadius: org.platform ? 0 : inner / 2, objectFit: 'cover' }} alt="" />
        ) : (
          <span style={{ color: 'white', fontSize: inner * 0.42, fontWeight: 700, letterSpacing: -1 }}>{initials(org.name)}</span>
        )}
      </div>
    ),
    { width: size, height: size },
  );
  res.headers.set('Cache-Control', 'public, max-age=3600');
  return res;
}
