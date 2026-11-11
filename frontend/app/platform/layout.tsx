import type { Metadata } from 'next';
import { PlatformShell } from './PlatformShell';

export const metadata: Metadata = { title: 'Panel Pengelola', robots: { index: false } };

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return <PlatformShell>{children}</PlatformShell>;
}
