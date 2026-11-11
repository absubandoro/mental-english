import { ImageResponse } from 'next/og';
import { imageDataUrl } from '@/lib/brand-image';
import { getOrg } from '@/lib/org-server';
import { brandShades, initials } from '@/lib/org';

/** Potong di batas kata */
const clip = (t: string, n: number) => (t.length <= n ? t : t.slice(0, t.lastIndexOf(' ', n)) + '…');

export const alt = 'Preview link';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Gambar preview saat link dibagikan (WhatsApp, Instagram, dll.) — sesuai identitas lembaga */
export default async function OgImage() {
  const org = await getOrg();
  const s = brandShades(org.brandColor);
  const [logo, photo] = await Promise.all([imageDataUrl(org.logoUrl), imageDataUrl(org.photos?.welcome)]);
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#060a1a', position: 'relative' }}>
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" width={1200} height={630} style={{ position: 'absolute', inset: 0, objectFit: 'cover', opacity: 0.45 }} />
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            background: `linear-gradient(100deg, #060a1a 25%, rgba(6,10,26,0.75) 60%, ${s[600]}66)`,
          }}
        />
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 90px', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} width={110} height={110} alt="" style={{ borderRadius: 55 }} />
            ) : (
              <div
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: 55,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `linear-gradient(135deg, ${s[400]}, ${s[600]})`,
                  color: 'white',
                  fontSize: 46,
                  fontWeight: 700,
                }}
              >
                {initials(org.name)}
              </div>
            )}
            <div style={{ width: 70, height: 4, background: s[300], display: 'flex' }} />
          </div>
          <div style={{ marginTop: 40, fontSize: 92, fontWeight: 800, color: 'white', lineHeight: 1, textTransform: 'uppercase', letterSpacing: -2, display: 'flex' }}>
            {org.name}
          </div>
          {org.tagline && <div style={{ marginTop: 22, fontSize: 40, color: s[200], display: 'flex' }}>{org.tagline}</div>}
          {org.description && (
            <div style={{ marginTop: 26, fontSize: 26, color: '#c3cde6', maxWidth: 820, lineHeight: 1.35, display: 'flex' }}>{clip(org.description, 150)}</div>
          )}
        </div>
      </div>
    ),
    size,
  );
}
