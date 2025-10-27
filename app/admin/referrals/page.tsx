import React from 'react';
import { requirePermission, PERMISSIONS } from '@/lib/auth/admin';
import ReferralsTable from '@/components/admin/ReferralsTable';

export default async function ReferralsPage() {
  // Ensure user has permission to view referrals
  await requirePermission(PERMISSIONS.VIEW_REFERRALS);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold text-neutral-950 dark:text-white uppercase">Referrals</h1>
          <p className="text-neutral-700 dark:text-neutral-300 mt-2">Monitor referral codes and conversions</p>
        </div>
      </div>

      <ReferralsTable />
    </div>
  );
}
