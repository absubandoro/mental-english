export function paginate(query: { page?: string | number; limit?: string | number }) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 12));
  return { page, limit, skip: (page - 1) * limit };
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

export function randomSuffix() {
  return Math.random().toString(36).slice(2, 7);
}

/** Hapus undefined agar update parsial tidak menimpa kolom */
export function clean<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}
