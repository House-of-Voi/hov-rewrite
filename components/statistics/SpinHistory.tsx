'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPlayerSpins } from '@/lib/api/statistics';
import { formatVoi, formatDate } from '@/lib/utils/format';

interface SpinHistoryProps {
  address: string;
  contractId?: number;
  limit?: number;
}

export function SpinHistory({
  address,
  contractId,
  limit = 20,
}: SpinHistoryProps) {
  const [offset, setOffset] = useState(0);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['playerSpins', address, contractId, limit, offset],
    queryFn: () =>
      fetchPlayerSpins(address, {
        contractId,
        limit,
        offset,
        order: 'desc',
      }),
    staleTime: 30 * 1000, // 30 seconds (spins are frequent)
  });

  const handlePrevious = () => {
    setOffset(Math.max(0, offset - limit));
  };

  const handleNext = () => {
    if (data && data.spins.length === limit) {
      setOffset(offset + limit);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gold-400">Spin History</h2>
        <p className="text-neutral-500 text-sm mt-1">
          Recent spins for {address.slice(0, 12)}...
        </p>
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
      ) : isError || !data ? (
        <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-6 text-center">
          <p className="text-red-400">Failed to load spin history</p>
        </div>
      ) : data.spins.length === 0 ? (
        <div className="bg-neutral-900/50 border border-gold-900/20 rounded-lg p-6 text-center">
          <p className="text-neutral-400">No spins recorded yet</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gold-900/20 text-left text-xs font-semibold text-neutral-500 uppercase">
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3 text-right">Bet</th>
                  <th className="px-4 py-3 text-right">Payout</th>
                  <th className="px-4 py-3 text-right">Result</th>
                  <th className="px-4 py-3 text-right">Block</th>
                  <th className="px-4 py-3 text-right">Tx</th>
                </tr>
              </thead>
              <tbody>
                {data.spins.map((spin) => {
                  const payout = BigInt(spin.payout);
                  const amount = BigInt(spin.amount);
                  const netResult = payout - amount;
                  const netResultNum = Number(netResult);
                  const isWin = netResult > 0n;

                  return (
                    <tr
                      key={spin.id}
                      className="border-b border-gold-900/10 hover:bg-gold-900/5 transition-colors"
                    >
                      <td className="px-4 py-3 text-neutral-300 text-sm">
                        {formatDate(spin.timestamp, 'short')}
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-300 text-sm">
                        {formatVoi(spin.amount, 2)} VOI
                      </td>
                      <td className="px-4 py-3 text-right text-blue-400 text-sm font-semibold">
                        {formatVoi(spin.payout, 2)} VOI
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-semibold text-sm ${
                          isWin ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {isWin ? '+' : ''}
                        {formatVoi(netResultNum, 2)} VOI
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-500 text-xs font-mono">
                        #{spin.block}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <a
                          href={`https://explorer.voi.network/tx/${spin.txid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gold-400 hover:text-gold-300 text-xs font-mono inline-block"
                          title={spin.txid}
                        >
                          {spin.txid.slice(0, 6)}...{spin.txid.slice(-4)}
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={offset === 0}
              className="px-4 py-2 rounded-lg bg-neutral-900/50 text-neutral-300 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-900 transition-all"
            >
              ← Previous
            </button>

            <p className="text-neutral-500 text-sm">
              Showing {offset + 1}–{Math.min(offset + limit, offset + data.spins.length)}
            </p>

            <button
              onClick={handleNext}
              disabled={data.spins.length < limit}
              className="px-4 py-2 rounded-lg bg-neutral-900/50 text-neutral-300 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-900 transition-all"
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
