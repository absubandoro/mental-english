import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="bg-mesh flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-7xl font-extrabold text-brand-300">404</p>
      <h1 className="mt-3 font-display text-2xl font-bold text-white">Halaman tidak ditemukan</h1>
      <Link href="/" className="mt-6 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-400">
        Kembali ke beranda
      </Link>
    </main>
  );
}
