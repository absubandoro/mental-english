'use client';

import { ProfileForm } from '@/components/ProfileForm';
import { PageHeader } from '@/components/ui';

export default function Page() {
  return (
    <>
      <PageHeader title="Profil Saya" />
      <ProfileForm />
    </>
  );
}
