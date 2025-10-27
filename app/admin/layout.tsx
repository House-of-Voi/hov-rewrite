import React from 'react';
import { redirect } from 'next/navigation';
import { getAdminRole, getCurrentProfileId } from '@/lib/auth/admin';
import AdminNav from '@/components/admin/AdminNav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Check if user is authenticated and has admin access
  const profileId = await getCurrentProfileId();

  if (!profileId) {
    redirect('/auth');
  }

  const adminRole = await getAdminRole(profileId);

  if (!adminRole) {
    redirect('/app');
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <AdminNav role={adminRole.role} permissions={adminRole.permissions} />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="space-y-8">{children}</div>
      </main>
    </div>
  );
}
