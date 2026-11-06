import { DashboardShell } from '@/components/DashboardShell';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell area="admin" roles={['ADMIN', 'SUPER_ADMIN']}>
      {children}
    </DashboardShell>
  );
}
