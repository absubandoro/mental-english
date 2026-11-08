'use client';

import Link from 'next/link';

export interface TabItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  badge?: number;
}

/** Tab bar bawah ala aplikasi — hanya tampil di layar HP/tablet kecil */
export function MobileTabBar({ items, label }: { items: TabItem[]; label: string }) {
  return (
    <nav
      aria-label={label}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink-900/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1">
        {items.map((it) => {
          const Icon = it.icon;
          const inner = (
            <>
              <span
                className={`relative flex h-8 w-14 items-center justify-center rounded-full transition-all duration-200 ${
                  it.active ? 'bg-brand-500/20 text-brand-200' : 'text-slate-400'
                }`}
              >
                <Icon className="size-[22px]" strokeWidth={it.active ? 2.4 : 2} />
                {!!it.badge && (
                  <span className="absolute -top-0.5 right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-ink-900">
                    {it.badge > 9 ? '9+' : it.badge}
                  </span>
                )}
              </span>
              <span className={`mt-0.5 truncate text-[11px] leading-tight ${it.active ? 'font-semibold text-white' : 'text-slate-400'}`}>{it.label}</span>
            </>
          );
          const cls = 'flex w-full flex-col items-center px-1 pt-2 pb-2 select-none active:scale-95 transition-transform';
          return (
            <li key={it.key} className="min-w-0 flex-1">
              {it.href ? (
                <Link href={it.href} className={cls} aria-current={it.active ? 'page' : undefined}>
                  {inner}
                </Link>
              ) : (
                <button type="button" onClick={it.onClick} className={cls} aria-expanded={it.active}>
                  {inner}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Spacer agar konten tidak tertutup tab bar */
export function TabBarSpacer() {
  return <div aria-hidden className="h-[calc(4.5rem+env(safe-area-inset-bottom))] lg:hidden" />;
}
