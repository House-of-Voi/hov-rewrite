'use client';

import React from 'react';
import type { MimirPlayerStats } from '@/lib/types/database';
import { formatNumberCompact, formatCurrency, formatVoi } from '@/lib/utils/format';

interface PlayerStatsCardProps {
  stats: MimirPlayerStats | null;
  address: string;
  isLoading?: boolean;
  showAddress?: boolean;
}

export function PlayerStatsCard({
  stats,
  address,
  isLoading = false,
  showAddress = true,
}: PlayerStatsCardProps) {
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-neutral-900/50 to-neutral-950 border border-gold-900/20 rounded-xl p-6 animate-pulse">
        <div className="h-4 bg-gold-900/20 rounded w-32 mb-4"></div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-3 bg-gold-900/20 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-gradient-to-br from-neutral-900/50 to-neutral-950 border border-gold-900/20 rounded-xl p-6">
        <p className="text-neutral-400 text-sm">
          No statistics available for {showAddress ? address : 'this address'}
        </p>
      </div>
    );
  }

  const rtp = parseFloat(stats.rtp.toString());
  const winRate = parseFloat(stats.win_rate.toString());

  return (
    <div className="bg-gradient-to-br from-neutral-900/50 to-neutral-950 border border-gold-900/20 rounded-xl p-6 hover:border-gold-900/40 transition-all">
      {showAddress && (
        <p className="text-neutral-500 text-xs font-mono mb-4 truncate">
          {address}
        </p>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-neutral-500 text-xs mb-1">Total Spins</p>
            <p className="text-xl font-bold text-gold-400">
              {formatNumberCompact(stats.total_spins)}
            </p>
          </div>
          <div>
            <p className="text-neutral-500 text-xs mb-1">Win Rate</p>
            <p className="text-xl font-bold text-gold-400">
              {winRate.toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="border-t border-gold-900/20 pt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-neutral-600 text-xs mb-1">Total Wagered</p>
              <p className="text-emerald-400 font-semibold">
                {formatVoi(stats.total_bet, 2)} VOI
              </p>
            </div>
            <div>
              <p className="text-neutral-600 text-xs mb-1">Total Won</p>
              <p className="text-blue-400 font-semibold">
                {formatVoi(stats.total_won, 2)} VOI
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gold-900/20 pt-4">
          <div className="flex justify-between items-center">
            <p className="text-neutral-600 text-xs">Net Result</p>
            <p
              className={`font-bold ${
                BigInt(stats.net_result) >= 0n
                  ? 'text-emerald-400'
                  : 'text-red-400'
              }`}
            >
              {BigInt(stats.net_result) >= 0n ? '+' : ''}
              {formatVoi(stats.net_result, 2)} VOI
            </p>
          </div>
        </div>

        <div className="border-t border-gold-900/20 pt-4 grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-neutral-600 mb-1">RTP</p>
            <p
              className={`font-semibold ${
                rtp >= 96.5 ? 'text-emerald-400' : 'text-orange-400'
              }`}
            >
              {rtp.toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-neutral-600 mb-1">Largest Win</p>
            <p className="text-gold-400 font-semibold">
              {formatVoi(stats.largest_win, 2)} VOI
            </p>
          </div>
        </div>

        <div className="border-t border-gold-900/20 pt-4 grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-neutral-600 mb-1">Winning Spins</p>
            <p className="text-emerald-400 font-semibold">
              {formatNumberCompact(stats.winning_spins)}
            </p>
          </div>
          <div>
            <p className="text-neutral-600 mb-1">Losing Spins</p>
            <p className="text-red-400 font-semibold">
              {formatNumberCompact(stats.losing_spins)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
