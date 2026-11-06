'use client';

import { use } from 'react';
import { SessionEditor } from '@/components/SessionEditor';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <SessionEditor id={id} base="/admin" readOnly />;
}
