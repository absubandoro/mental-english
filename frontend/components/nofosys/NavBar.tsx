'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { NofosysMark } from './NofosysMark';

const LINKS = [
  { href: '#fitur', label: 'Fitur' },
  { href: '#merek', label: 'White-label' },
  { href: '#peran', label: 'Untuk siapa' },
  { href: '#cara-kerja', label: 'Cara kerja' },
  { href: '#faq', label: 'FAQ' },
];

export function NavBar({ name }: { name: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <header className={`fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)] transition-all duration-300 ${scrolled || open ? 'border-b border-white/8 bg-[#05060f]/80 backdrop-blur-xl' : ''}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <NofosysMark size={34} />
          <span className="text-lg font-extrabold tracking-tight text-white">{name}</span>
        </Link>
        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="rounded-full px-3.5 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Link href="/platform/masuk" className="hidden rounded-full px-4 py-2 text-sm text-slate-300 transition hover:text-white sm:inline-flex">
            Masuk
          </Link>
          <a
            href="#demo"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#05060f] shadow-[0_0_30px_-6px_rgba(167,139,250,0.8)] transition hover:bg-violet-100"
          >
            Minta demo
          </a>
          <button onClick={() => setOpen(!open)} className="rounded-full p-2 text-slate-200 lg:hidden" aria-label="Menu">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="grid gap-1 border-t border-white/8 px-4 py-3 lg:hidden">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-base text-slate-200 active:bg-white/5">
              {l.label}
            </a>
          ))}
          <Link href="/platform/masuk" className="rounded-xl px-3 py-3 text-base text-slate-400">
            Masuk panel pengelola
          </Link>
        </nav>
      )}
    </header>
  );
}
