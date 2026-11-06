import { DashboardShell } from '@/components/DashboardShell';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell area="parent" roles={['PARENT']}>
      {children}
    </DashboardShell>
  );
}
