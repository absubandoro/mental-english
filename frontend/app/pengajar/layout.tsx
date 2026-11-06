import { DashboardShell } from '@/components/DashboardShell';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell area="teacher" roles={['TEACHER']}>
      {children}
    </DashboardShell>
  );
}
