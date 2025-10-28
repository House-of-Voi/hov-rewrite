import React from 'react';
import { requirePermission, PERMISSIONS } from '@/lib/auth/admin';
import PlayersTable from '@/components/admin/PlayersTable';

export const dynamic = 'force-dynamic';

export default async function PlayersPage() {
  // Ensure user has permission to view players
  await requirePermission(PERMISSIONS.VIEW_PLAYERS);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold text-neutral-950 dark:text-white uppercase">Players</h1>
          <p className="text-neutral-700 dark:text-neutral-300 mt-2">Manage player accounts, access, and profiles</p>
        </div>
      </div>

      <PlayersTable />
    </div>
  );
}
