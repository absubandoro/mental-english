import type { MetadataRoute } from 'next';

/** Web App Manifest — website bisa dipasang ke layar utama HP dan terbuka seperti aplikasi */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mental English',
    short_name: 'Mental English',
    description: 'Build Your Mental Focus! Portal pelajar, orang tua, pengajar, dan admin Mental English.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#060a1a',
    theme_color: '#060a1a',
    lang: 'id',
    categories: ['education'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Dashboard Anak', url: '/orang-tua/dashboard', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
      { name: 'Kelas Hari Ini', url: '/pengajar/sesi', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
    ],
  };
}
