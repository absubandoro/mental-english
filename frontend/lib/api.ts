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

export interface UploadResult {
  url: string;
  type: 'image' | 'video';
  name: string;
  size: number;
}

/** Unggah gambar (maks. 8 MB) atau video (maks. 100 MB) dengan progres 0–100 */
export function uploadFile(file: File, onProgress?: (pct: number) => void): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/uploads`);
    const token = getToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let data: { message?: string | string[] } & Partial<UploadResult> = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        /* abaikan */
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data as UploadResult);
      else if (xhr.status === 413) reject(new ApiError('File terlalu besar', 413));
      else reject(new ApiError(Array.isArray(data.message) ? data.message.join(', ') : data.message || 'Gagal mengunggah file', xhr.status));
    };
    xhr.onerror = () => reject(new ApiError('Koneksi terputus saat mengunggah', 0));
    const form = new FormData();
    form.append('file', file);
    xhr.send(form);
  });
}

export async function uploadImage(file: File) {
  return uploadFile(file);
}
