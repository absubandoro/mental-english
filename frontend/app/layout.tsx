import type { Metadata, Viewport } from 'next';
import { Oswald, Plus_Jakarta_Sans, Roboto_Slab } from 'next/font/google';
import { OrgProvider } from '@/components/OrgProvider';
import { AuthProvider } from '@/lib/auth';
import { brandCss } from '@/lib/org';
import { getOrg } from '@/lib/org-server';
import { tenantHost } from '@/lib/server-api';
import './globals.css';

const body = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const condensed = Oswald({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-oswald', display: 'swap' });
const slab = Roboto_Slab({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-slab', display: 'swap' });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/** Judul, deskripsi, ikon, dan preview link mengikuti lembaga dari domain yang dibuka */
export async function generateMetadata(): Promise<Metadata> {
  const org = await getOrg();
  const host = await tenantHost();
  const proto = host.includes('localhost') || /^\d/.test(host) ? 'http' : 'https';
  const title = org.tagline ? `${org.name} — ${org.tagline}` : org.name;
  const description = org.description || `${org.name}: blog, mading karya pelajar, lokasi cabang, dan portal pelajar, orang tua, pengajar.`;
  return {
    metadataBase: new URL(host ? `${proto}://${host}` : SITE_URL),
    title: { default: title, template: `%s · ${org.name}` },
    description,
    applicationName: org.name,
    icons: { icon: [{ url: '/brand/icon?size=64', type: 'image/png' }], apple: [{ url: '/brand/icon?size=180&maskable=1' }] },
    openGraph: { type: 'website', siteName: org.name, title, description, locale: 'id_ID' },
    twitter: { card: 'summary_large_image', title: org.name, description },
    // Saat dipasang ke layar utama iPhone, tampil layar penuh seperti aplikasi
    appleWebApp: { capable: true, title: org.name, statusBarStyle: 'black-translucent' },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: '#060a1a',
  colorScheme: 'dark',
  viewportFit: 'cover',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const org = await getOrg();
  return (
    <html lang="id" className={`${body.variable} ${slab.variable} ${condensed.variable}`}>
      <body className="font-sans">
        {/* Warna merek lembaga menimpa warna bawaan tema */}
        <style dangerouslySetInnerHTML={{ __html: brandCss(org.brandColor) }} />
        <OrgProvider org={org}>
          <AuthProvider>{children}</AuthProvider>
        </OrgProvider>
      </body>
    </html>
  );
}
