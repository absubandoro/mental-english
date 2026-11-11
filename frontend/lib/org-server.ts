import 'server-only';
import { cache } from 'react';
import { FALLBACK_ORG, type Org } from './org';
import { serverGet } from './server-api';

/** Organisasi dari domain request ini (sekali per request) */
export const getOrg = cache(async (): Promise<Org> => (await serverGet<Org>('/org')) ?? FALLBACK_ORG);
