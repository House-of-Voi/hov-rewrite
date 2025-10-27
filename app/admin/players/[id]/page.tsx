import React from 'react';
import Link from 'next/link';
import { requirePermission, PERMISSIONS } from '@/lib/auth/admin';
import PlayerDetailClient from '@/components/admin/PlayerDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PlayerDetailPage({ params }: PageProps) {
  await requirePermission(PERMISSIONS.VIEW_PLAYERS);
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/players"
            className="text-gold-400 hover:text-gold-300 text-sm font-bold mb-2 inline-block uppercase tracking-wide"
          >
            ← Back to Players
          </Link>
          <h1 className="text-4xl font-black text-gold-400 neon-text uppercase">Player Details</h1>
        </div>
      </div>

      <PlayerDetailClient playerId={id} />
    </div>
  );
}
