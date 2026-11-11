'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { API_URL, ApiError, qs, tenantHeader } from './api';

/** Token pengelola platform — terpisah dari token akun lembaga */
const KEY = 'nofosys_platform_token';

const getToken = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};
const setToken = (t: string | null) => {
  try {
    if (t) localStorage.setItem(KEY, t);
    else localStorage.removeItem(KEY);
  } catch {
    /* abaikan */
  }
};

export async function papi<T = unknown>(path: string, opts: { method?: string; body?: unknown; query?: Record<string, string | undefined> } = {}): Promise<T> {
  const headers: Record<string, string> = tenantHeader();
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API_URL}/platform${path}${qs(opts.query)}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    if (res.status === 401 && token) window.dispatchEvent(new Event('nofosys:unauthorized'));
    throw new ApiError(Array.isArray(data?.message) ? data.message.join(', ') : data?.message || 'Terjadi kesalahan', res.status);
  }
  return data as T;
}

/** Ambil data dari API panel; reload() untuk memuat ulang */
export function usePlatformApi<T>(path: string | null, query?: Record<string, string | undefined>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const key = path ? path + qs(query) : null;
  const load = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    try {
      setData(await papi<T>(path, { query }));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => {
    load();
  }, [load]);
  return { data, error, loading, reload: load, setData };
}

export interface PlatformAdmin {
  id: string;
  name: string;
  email: string;
  isActive?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
}

interface Ctx {
  admin: PlatformAdmin | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setAdmin: (a: PlatformAdmin) => void;
}

const PlatformCtx = createContext<Ctx | null>(null);

export function PlatformAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<PlatformAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    (async () => {
      if (getToken()) {
        try {
          setAdmin(await papi<PlatformAdmin>('/auth/me'));
        } catch {
          setToken(null);
        }
      }
      setLoading(false);
    })();
    const out = () => (setToken(null), setAdmin(null));
    window.addEventListener('nofosys:unauthorized', out);
    return () => window.removeEventListener('nofosys:unauthorized', out);
  }, []);

  // Belum login -> halaman masuk
  useEffect(() => {
    if (!loading && !admin && path !== '/platform/masuk') router.replace('/platform/masuk');
  }, [loading, admin, path, router]);

  const login = useCallback(async (email: string, password: string) => {
    const r = await papi<{ token: string; admin: PlatformAdmin }>('/auth/login', { method: 'POST', body: { email, password } });
    setToken(r.token);
    setAdmin(r.admin);
  }, []);
  const logout = useCallback(() => {
    setToken(null);
    setAdmin(null);
    router.replace('/platform/masuk');
  }, [router]);

  return <PlatformCtx.Provider value={{ admin, loading, login, logout, setAdmin }}>{children}</PlatformCtx.Provider>;
}

export function usePlatformAuth() {
  const c = useContext(PlatformCtx);
  if (!c) throw new Error('usePlatformAuth di luar PlatformAuthProvider');
  return c;
}

// ---- tipe data panel

export interface OrgRow {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  brandColor: string;
  email: string | null;
  isActive: boolean;
  createdAt: string;
  domains: string[];
  urls: string[];
  branches: number;
  students: number;
  staff: number;
  parents: number;
}

export interface OrgDetail extends Omit<OrgRow, 'domains' | 'branches'> {
  tagline: string | null;
  subscriptionEnabled: boolean;
  planName: string | null;
  baseFee: number;
  perStudentFee: number;
  dueDay: number;
  invoiceLeadDays: number;
  subscriptionStart: string | null;
  estimate: { activeStudents: number; amount: number };
  notes: string | null;
  cnameTarget: string | null;
  domains: { id: string; domain: string; createdAt: string }[];
  branches: { id: string; name: string; city: string | null; createdAt: string }[];
  admins: { id: string; name: string; email: string; isActive: boolean; createdAt: string }[];
}

export type LeadStatus = 'BARU' | 'DIHUBUNGI' | 'JADI_KLIEN' | 'TIDAK_LANJUT';

export interface Lead {
  id: string;
  name: string;
  institution: string;
  phone: string;
  email: string | null;
  city: string | null;
  size: string | null;
  message: string | null;
  status: LeadStatus;
  note: string | null;
  createdAt: string;
}

export interface PlatformStats {
  newLeads: number;
  invoices: { waiting: number; unpaid: number; overdue: number };
  orgs: number;
  active: number;
  inactive: number;
  branches: number;
  students: number;
  staff: number;
  parents: number;
  newOrgs: number;
}
