'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMyProfileBreakdown } from '@/lib/api/statistics';
import { PlayerStatsCard } from './PlayerStatsCard';

interface AddressBreakdownProps {
  contractId?: number;
}

export function AddressBreakdown({ contractId }: AddressBreakdownProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['profileBreakdown', contractId],
    queryFn: () => fetchMyProfileBreakdown(contractId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-gold-900/20 rounded w-48 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-neutral-900/50 to-neutral-950 border border-gold-900/20 rounded-xl p-6 animate-pulse"
            >
              <div className="space-y-3">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-3 bg-gold-900/20 rounded w-full"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-6">
        <p className="text-red-400">Failed to load address breakdown</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-neutral-900/50 border border-gold-900/20 rounded-xl p-6">
        <p className="text-neutral-400">No linked addresses</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gold-400">Your Addresses</h3>
        <p className="text-neutral-500 text-sm mt-1">
          Statistics for each of your {data.length} linked {data.length === 1 ? 'address' : 'addresses'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((entry) => (
          <div key={entry.address} className="space-y-2">
            <div className="flex items-center gap-2 px-2">
              <span className="text-xs font-semibold text-neutral-500 uppercase">
                {entry.chain}
              </span>
              <span className="text-xs text-neutral-600">
                {entry.address.slice(0, 12)}...{entry.address.slice(-6)}
              </span>
            </div>
            <PlayerStatsCard
              stats={entry.stats}
              address={entry.address}
              showAddress={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
