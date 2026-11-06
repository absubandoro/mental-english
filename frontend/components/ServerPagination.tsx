import Link from 'next/link';

export function ServerPagination({ base, params, page, total, limit }: { base: string; params: Record<string, string | undefined>; page: number; total: number; limit: number }) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams(Object.entries({ ...params, page: String(p) }).filter(([, v]) => v) as [string, string][]);
    return `${base}?${sp}`;
  };
  const cls = 'rounded-xl border border-white/10 px-3.5 py-1.5 text-sm transition hover:bg-white/5';
  return (
    <div className="mt-10 flex items-center justify-center gap-2">
      {page > 1 && <Link className={cls} href={href(page - 1)}>Sebelumnya</Link>}
      <span className="px-2 text-sm text-slate-400">
        Halaman {page} dari {pages}
      </span>
      {page < pages && <Link className={cls} href={href(page + 1)}>Berikutnya</Link>}
    </div>
  );
}
