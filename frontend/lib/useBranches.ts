'use client';

import { useApi } from './hooks';
import type { Branch } from './types';

export function useBranches() {
  const { data, loading, reload } = useApi<Branch[]>('/branches');
  return { branches: data ?? [], loading, reload };
}
