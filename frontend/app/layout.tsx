import type { Metadata, Viewport } from 'next';
import { Oswald, Plus_Jakarta_Sans, Roboto_Slab } from 'next/font/google';
import { AuthProvider } from '@/lib/auth';
import './globals.css';

const body = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const condensed = Oswald({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-oswald', display: 'swap' });
const slab = Roboto_Slab({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-slab', display: 'swap' });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const DESCRIPTION =
  'Mental English — kursus bahasa Inggris yang membangun mental dan fokus. Blog, mading karya pelajar, lokasi cabang, dan portal pelajar, orang tua, pengajar.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Mental English — Build Your Mental Focus!', template: '%s · Mental English' },
  description: DESCRIPTION,
  applicationName: 'Mental English',
  openGraph: {
    type: 'website',
    siteName: 'Mental English',
    title: 'Mental English — Build Your Mental Focus!',
    description: DESCRIPTION,
    locale: 'id_ID',
  },
  twitter: { card: 'summary_large_image', title: 'Mental English', description: DESCRIPTION },
  // Saat dipasang ke layar utama iPhone, tampil layar penuh seperti aplikasi
  appleWebApp: { capable: true, title: 'Mental English', statusBarStyle: 'black-translucent' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#060a1a',
  colorScheme: 'dark',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${body.variable} ${slab.variable} ${condensed.variable}`}>
      <body className="font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
