import React from 'react';
import { Metadata } from 'next';
import { PlatformStats } from '@/components/statistics/PlatformStats';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Statistics | House of Voi',
  description: 'View platform statistics for House of Voi games',
};

const ALPHA_SLOTS_CONTRACT_ID = 40879920;

export default function StatsPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-gold-300 to-gold-500 mb-2 neon-text">
            Platform Statistics
          </h1>
          <p className="text-neutral-400 text-lg">
            Real-time analytics for House of Voi slot machines
          </p>
        </div>
      </div>

      {/* Platform Stats */}
      <section className="space-y-6">
        <PlatformStats
          contractId={ALPHA_SLOTS_CONTRACT_ID}
          machineDisplayName="Alpha Slots"
        />
      </section>

      {/* Info Section */}
      <section className="bg-gradient-to-r from-warning-500/10 to-warning-600/5 border border-warning-200 dark:border-warning-900/20 rounded-xl p-8">
        <h2 className="text-xl font-bold text-warning-500 dark:text-warning-400 mb-4">About These Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-neutral-600 dark:text-neutral-400">
          <div>
            <h3 className="text-warning-500 dark:text-warning-400 font-semibold mb-2">Daily Statistics</h3>
            <p className="text-sm">
              View platform performance for any specific day. Select a date to see spins, wagering volume, payouts, and more for that 24-hour period.
            </p>
          </div>
          <div>
            <h3 className="text-warning-500 dark:text-warning-400 font-semibold mb-2">All-Time Statistics</h3>
            <p className="text-sm">
              Cumulative platform statistics since launch. Perfect for tracking long-term trends and overall platform health.
            </p>
          </div>
          <div>
            <h3 className="text-warning-500 dark:text-warning-400 font-semibold mb-2">Real-Time Data</h3>
            <p className="text-sm">
              All statistics are powered by the Mimir indexer, which tracks every spin on the Voi blockchain in real-time.
            </p>
          </div>
          <div>
            <h3 className="text-warning-500 dark:text-warning-400 font-semibold mb-2">Fair Gaming</h3>
            <p className="text-sm">
              Our RTP (Return to Player) and house edge are calculated from on-chain data to ensure complete transparency and fair gameplay.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
