export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

const TOKEN_KEY = 'me_token';

export function getToken() {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* abaikan */
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

export function qs(query?: Query) {
  if (!query) return '';
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : '';
}

/** Fetch dari browser, otomatis menyertakan token login */
export async function api<T = unknown>(
  path: string,
  opts: { method?: string; body?: unknown; query?: Query; form?: FormData } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API_URL}${path}${qs(opts.query)}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.form ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = Array.isArray(data?.message) ? data.message.join(', ') : data?.message || 'Terjadi kesalahan';
    if (res.status === 401 && token && typeof window !== 'undefined') window.dispatchEvent(new Event('me:unauthorized'));
    throw new ApiError(msg, res.status);
  }
  return data as T;
}

export async function uploadImage(file: File) {
  const form = new FormData();
  form.append('file', file);
  return api<{ url: string }>('/uploads', { method: 'POST', form });
}
