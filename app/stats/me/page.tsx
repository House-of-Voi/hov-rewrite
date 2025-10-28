'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMyProfileStats } from '@/lib/api/statistics';
import { AddressBreakdown } from '@/components/statistics/AddressBreakdown';
import { SpinHistory } from '@/components/statistics/SpinHistory';
import { formatVoi, formatPercent } from '@/lib/utils/format';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

const ALPHA_SLOTS_CONTRACT_ID = 40879920;

export default function MyStatsPage() {
  const router = useRouter();
  const [selectedAddress] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['myProfileStats', ALPHA_SLOTS_CONTRACT_ID],
    queryFn: () => fetchMyProfileStats(ALPHA_SLOTS_CONTRACT_ID),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });

  // Handle auth errors
  React.useEffect(() => {
    if (error instanceof Error && error.message === 'Not authenticated') {
      router.push('/auth/login');
    }
  }, [error, router]);

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-4xl font-black text-gold-400">My Statistics</h1>
        <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-6">
          <p className="text-red-400 font-semibold">
            {error instanceof Error && error.message === 'Not authenticated'
              ? 'Please log in to view your statistics'
              : 'Failed to load your statistics'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-gold-300 to-gold-500 neon-text">
          My Statistics
        </h1>
        <p className="text-neutral-400 text-lg">
          Track your gaming performance across all your linked addresses
        </p>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-32 bg-gradient-to-br from-neutral-900/50 to-neutral-950 border border-gold-900/20 rounded-xl p-6 animate-pulse"></div>
        </div>
      ) : data ? (
        <>
          {/* Aggregate Stats Card */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-neutral-900/50 to-neutral-950 border border-gold-900/20 rounded-xl p-6">
              <p className="text-neutral-500 text-xs font-medium mb-2">Total Spins</p>
              <p className="text-2xl font-bold text-gold-400">{data.total_spins}</p>
            </div>
            <div className="bg-gradient-to-br from-neutral-900/50 to-neutral-950 border border-gold-900/20 rounded-xl p-6">
              <p className="text-neutral-500 text-xs font-medium mb-2">Win Rate</p>
              <p className="text-2xl font-bold text-gold-400">
                {formatPercent(data.win_rate, 2)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-neutral-900/50 to-neutral-950 border border-gold-900/20 rounded-xl p-6">
              <p className="text-neutral-500 text-xs font-medium mb-2">RTP</p>
              <p className="text-2xl font-bold text-gold-400">
                {formatPercent(data.rtp, 2)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-neutral-900/50 to-neutral-950 border border-gold-900/20 rounded-xl p-6">
              <p className="text-neutral-500 text-xs font-medium mb-2">
                Net Result
              </p>
              <p
                className={`text-2xl font-bold ${
                  BigInt(data.net_result) >= 0n
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }`}
              >
                {BigInt(data.net_result) >= 0n ? '+' : ''}
                {formatVoi(data.net_result, 2)} VOI
              </p>
            </div>
          </section>

          {/* Detailed Stats */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-neutral-900/50 to-neutral-950 border border-gold-900/20 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gold-400 mb-4">Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Winning Spins</span>
                  <span className="text-emerald-400 font-semibold">
                    {data.winning_spins}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Losing Spins</span>
                  <span className="text-red-400 font-semibold">
                    {data.losing_spins}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-gold-900/20 pt-3">
                  <span className="text-neutral-500">Total Wagered</span>
                  <span className="text-blue-400 font-semibold">
                    {formatVoi(data.total_bet, 2)} VOI
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Total Won</span>
                  <span className="text-emerald-400 font-semibold">
                    {formatVoi(data.total_won, 2)} VOI
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Largest Win</span>
                  <span className="text-gold-400 font-semibold">
                    {formatVoi(data.largest_win, 2)} VOI
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-neutral-900/50 to-neutral-950 border border-gold-900/20 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gold-400 mb-4">Key Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">RTP (Return to Player)</span>
                  <span
                    className={`font-semibold ${
                      data.rtp >= 96.5 ? 'text-emerald-400' : 'text-orange-400'
                    }`}
                  >
                    {formatPercent(data.rtp, 2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Win Rate</span>
                  <span className="text-gold-400 font-semibold">
                    {formatPercent(data.win_rate, 2)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-gold-900/20 pt-3">
                  <span className="text-neutral-500">Linked Addresses</span>
                  <span className="text-neutral-300 font-semibold">
                    {data.addresses.length}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Address Breakdown */}
          <section>
            <AddressBreakdown contractId={ALPHA_SLOTS_CONTRACT_ID} />
          </section>

          {/* Spin History */}
          {selectedAddress && (
            <section>
              <SpinHistory
                address={selectedAddress}
                contractId={ALPHA_SLOTS_CONTRACT_ID}
              />
            </section>
          )}
        </>
      ) : null}
    </div>
  );
}
