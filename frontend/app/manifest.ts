import type { MetadataRoute } from 'next';
import { getOrg } from '@/lib/org-server';

/** Web App Manifest — dipasang ke layar utama HP dengan nama & ikon lembaga */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const org = await getOrg();
  return {
    name: org.name,
    short_name: org.name.length > 14 ? org.name.split(' ')[0] : org.name,
    description: [org.tagline, `Portal pelajar, orang tua, pengajar, dan admin ${org.name}.`].filter(Boolean).join(' '),
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#060a1a',
    theme_color: '#060a1a',
    lang: 'id',
    categories: ['education'],
    icons: [
      { src: '/brand/icon?size=192', sizes: '192x192', type: 'image/png' },
      { src: '/brand/icon?size=512', sizes: '512x512', type: 'image/png' },
      { src: '/brand/icon?size=512&maskable=1', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Dashboard Anak', url: '/orang-tua/dashboard', icons: [{ src: '/brand/icon?size=192', sizes: '192x192' }] },
      { name: 'Kelas Hari Ini', url: '/pengajar/sesi', icons: [{ src: '/brand/icon?size=192', sizes: '192x192' }] },
    ],
  };
}
