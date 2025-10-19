'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchLeaderboard } from '@/lib/api/statistics';
import { formatNumberCompact, formatVoi, formatPercent } from '@/lib/utils/format';

interface LeaderboardProps {
  contractId?: number;
  limit?: number;
}

type Timeframe = 'daily' | 'all-time';
type RankBy = 'won' | 'profit' | 'rtp' | 'volume';

export function Leaderboard({
  contractId,
  limit = 50,
}: LeaderboardProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('daily');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [rankBy, setRankBy] = useState<RankBy>('profit');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['leaderboard', contractId, timeframe, selectedDate.toISOString().split('T')[0], rankBy, limit],
    queryFn: () =>
      fetchLeaderboard({
        contractId,
        timeframe,
        date: timeframe === 'daily' ? selectedDate : undefined,
        rankBy,
        limit,
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gold-400">Leaderboard</h2>
          <p className="text-neutral-500 text-sm mt-1">
            {timeframe === 'daily'
              ? `Daily leaderboard ${isToday(selectedDate) ? 'for today' : `for ${selectedDate.toLocaleDateString()}`}`
              : `All-time top ${limit} players`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2">
            {(['daily', 'all-time'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  timeframe === tf
                    ? 'bg-gold-600 text-neutral-950'
                    : 'bg-neutral-900/50 text-neutral-400 hover:bg-neutral-900'
                }`}
              >
                {tf === 'daily' ? 'Daily' : 'All Time'}
              </button>
            ))}
          </div>

          {timeframe === 'daily' && (
            <input
              type="date"
              value={formatDateForInput(selectedDate)}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              max={formatDateForInput(new Date())}
              className="px-4 py-2 rounded-lg bg-neutral-900/50 text-neutral-300 text-sm font-semibold border border-gold-900/20 hover:border-gold-900/40 transition-all focus:outline-none focus:border-gold-600"
            />
          )}

          <select
            value={rankBy}
            onChange={(e) => setRankBy(e.target.value as RankBy)}
            className="px-4 py-2 rounded-lg bg-neutral-900/50 text-neutral-300 text-sm font-semibold border border-gold-900/20 hover:border-gold-900/40 transition-all focus:outline-none focus:border-gold-600"
          >
            <option value="profit">Rank by Profit</option>
            <option value="won">Rank by Winnings</option>
            <option value="volume">Rank by Volume</option>
            <option value="rtp">Rank by RTP</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="bg-gradient-to-r from-neutral-900/50 to-neutral-950 border border-gold-900/20 rounded-lg p-4 animate-pulse"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 bg-gold-900/20 rounded w-24"></div>
                <div className="h-4 bg-gold-900/20 rounded w-32"></div>
              </div>
            </div>
          ))}
        </div>
      ) : isError || !data || data.length === 0 ? (
        <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-6 text-center">
          <p className="text-red-400">Failed to load leaderboard</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gold-900/20 text-left text-xs font-semibold text-neutral-500 uppercase">
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3 text-right">Spins</th>
                <th className="px-4 py-3 text-right">Volume</th>
                <th className="px-4 py-3 text-right">
                  {rankBy === 'profit'
                    ? 'Profit'
                    : rankBy === 'won'
                      ? 'Won'
                      : rankBy === 'volume'
                        ? 'Total Bet'
                        : 'RTP'}
                </th>
                <th className="px-4 py-3 text-right">Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {data.map((entry: any) => {
                const profit = BigInt(entry.net_result);
                const isWinning = profit >= 0n;
                const identifier = entry.identifier || entry.who;

                return (
                  <tr
                    key={`${identifier}-${entry.rank || entry.rank_position}`}
                    className="border-b border-gold-900/10 hover:bg-gold-900/5 transition-colors"
                  >
                    <td className="px-4 py-3 font-bold text-gold-400">
                      #{entry.rank || entry.rank_position}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-neutral-200 font-semibold text-sm">
                          {entry.display_name || (
                            <>
                              {identifier.slice(0, 6)}...{identifier.slice(-4)}
                            </>
                          )}
                        </p>
                        {entry.display_name && (
                          <p className="text-neutral-600 text-xs font-mono truncate">
                            {identifier.slice(0, 12)}...{identifier.slice(-6)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-300">
                      {formatNumberCompact(entry.total_spins)}
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-300">
                      {formatVoi(entry.total_bet || '0', 0)} VOI
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${
                        isWinning
                          ? 'text-emerald-400'
                          : 'text-red-400'
                      }`}
                    >
                      {rankBy === 'rtp'
                        ? formatPercent(entry.rtp, 2)
                        : `${isWinning ? '+' : ''}${formatVoi(
                            entry.net_result || '0',
                            2
                          )} VOI`}
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-300">
                      {formatPercent(entry.win_rate, 2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
