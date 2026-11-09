'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from './api';
import { ROLE_HOME } from './format';
import type { Role, User } from './types';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, branchId?: string) => Promise<User>;
  logout: () => void;
  refresh: () => Promise<void>;
  setUser: (u: User) => void;
  /** Super admin dapat memilih cabang aktif; role lain = cabang miliknya */
  activeBranchId: string | null;
  setActiveBranchId: (id: string | null) => void;
}

const AuthContext = createContext<AuthState | null>(null);
const BRANCH_KEY = 'me_active_branch';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [superBranch, setSuperBranch] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      setUser(await api<User>('/auth/me'));
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      setSuperBranch(localStorage.getItem(BRANCH_KEY));
    } catch {
      /* abaikan */
    }
    refresh();
    const onUnauthorized = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener('me:unauthorized', onUnauthorized);
    return () => window.removeEventListener('me:unauthorized', onUnauthorized);
  }, [refresh]);

  const login = useCallback(async (email: string, password: string, branchId?: string) => {
    const res = await api<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: { email, password, branchId: branchId || undefined },
    });
    setToken(res.token);
    const me = await api<User>('/auth/me');
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const setActiveBranchId = useCallback((id: string | null) => {
    setSuperBranch(id);
    try {
      if (id) localStorage.setItem(BRANCH_KEY, id);
      else localStorage.removeItem(BRANCH_KEY);
    } catch {
      /* abaikan */
    }
  }, []);

  const activeBranchId = user?.role === 'SUPER_ADMIN' ? superBranch : user?.branchId ?? null;

  const value = useMemo(
    () => ({ user, loading, login, logout, refresh, setUser, activeBranchId, setActiveBranchId }),
    [user, loading, login, logout, refresh, activeBranchId, setActiveBranchId],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus di dalam AuthProvider');
  return ctx;
}

/** Hanya role tertentu yang boleh melihat halaman; selain itu diarahkan */
export function useRequireRole(roles: Role[]) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const allowed = !!user && roles.includes(user.role);
  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    else if (!roles.includes(user.role)) router.replace(ROLE_HOME[user.role]);
  }, [loading, user, roles, router]);
  return { user, ready: !loading && allowed };
}
