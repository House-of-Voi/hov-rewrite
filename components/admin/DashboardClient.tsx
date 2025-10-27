'use client';

import { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader } from '@/components/Card';
import StatCard from '@/components/StatCard';
import { CoinsIcon, UsersIcon, TrendingUpIcon, ChartIcon, SlotMachineIcon, BoltIcon } from '@/components/icons';
import ChainBadge from '@/components/ChainBadge';
import GrandTotalCard from '@/components/admin/GrandTotalCard';
import TreasuryTable from '@/components/admin/TreasuryTable';
import type { DashboardStats } from '@/lib/types/admin';
import { formatNumberCompact } from '@/lib/utils/format';

export default function DashboardClient() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    fetchDashboardStats();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard');
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch dashboard stats');
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const syncTreasury = async () => {
    setSyncing(true);
    setSyncError(null);

    try {
      const response = await fetch('/api/admin/treasury/sync', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        setLastSyncTime(new Date());
        // Refresh dashboard stats after sync
        await fetchDashboardStats();
      } else {
        setSyncError(data.error || 'Failed to sync treasury');
      }
    } catch (err) {
      console.error('Error syncing treasury:', err);
      setSyncError('Failed to sync treasury');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-neutral-700 dark:text-neutral-300">Loading dashboard...</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card>
        <CardContent>
          <div className="text-error-600 dark:text-error-400 p-4">{error || 'Failed to load dashboard'}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold text-neutral-950 dark:text-white">Platform Dashboard</h1>
          <p className="text-neutral-700 dark:text-neutral-300 mt-2">
            Operations and analytics overview
          </p>
          {lastSyncTime && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Last treasury sync: {lastSyncTime.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={syncTreasury}
            disabled={syncing}
            className={`px-4 py-2 text-sm border-2 rounded-lg font-medium transition-colors ${
              syncing
                ? 'border-neutral-300 dark:border-neutral-700 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                : 'border-success-300 dark:border-success-700 text-success-600 dark:text-success-400 hover:bg-success-50 dark:hover:bg-success-950'
            }`}
          >
            {syncing ? 'Refreshing...' : 'Refresh'}
          </button>
          <a href="/admin/games">
            <button className="px-4 py-2 text-sm border-2 border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors font-medium">
              Manage Games
            </button>
          </a>
          <a href="/admin/analytics">
            <button className="px-4 py-2 text-sm border-2 border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors font-medium">
              Analytics
            </button>
          </a>
        </div>
      </div>

      {/* Sync Error Message */}
      {syncError && (
        <Card>
          <CardContent>
            <div className="text-error-600 dark:text-error-400 p-4">{syncError}</div>
          </CardContent>
        </Card>
      )}

      {/* Grand Total Treasury */}
      <GrandTotalCard grandTotal={stats.grand_total} />

      {/* Individual Machine Treasuries */}
      <TreasuryTable treasuries={stats.treasuries} />

      {/* Today's Performance */}
      <div>
        <h2 className="text-xl font-semibold text-neutral-950 dark:text-white mb-4">Today&apos;s Activity</h2>
        <div className="grid md:grid-cols-5 gap-6">
          <StatCard
            title="Total Volume"
            value={formatNumberCompact(parseFloat(stats.today.total_wagered))}
            subtitle="Across all games"
            icon={<CoinsIcon size={24} />}
          />
          <StatCard
            title="Total Rewards"
            value={formatNumberCompact(parseFloat(stats.today.total_payout))}
            subtitle="Player earnings"
            icon={<TrendingUpIcon size={24} />}
          />
          <StatCard
            title="Platform Revenue"
            value={formatNumberCompact(parseFloat(stats.today.house_profit))}
            subtitle={`${(
              (parseFloat(stats.today.house_profit) / parseFloat(stats.today.total_wagered || '1')) *
              100
            ).toFixed(1)}% margin`}
            icon={<ChartIcon size={24} />}
          />
          <StatCard
            title="Active Users"
            value={stats.today.active_users}
            subtitle="Unique players"
            icon={<UsersIcon size={24} />}
          />
          <StatCard
            title="Total Sessions"
            value={stats.today.total_rounds}
            subtitle="Games played"
            icon={<SlotMachineIcon size={32} />}
          />
        </div>
      </div>

      {/* Live Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Live Game Feed */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gold-400 uppercase flex items-center gap-2">
                <BoltIcon size={24} />
                Live Game Feed
              </h3>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-xs text-green-400 font-bold uppercase">Live</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.live_feed.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">No recent activity</div>
            ) : (
              stats.live_feed.slice(0, 10).map((game) => {
                const profit = parseFloat(game.profit_amount);
                return (
                  <div
                    key={game.id}
                    className="p-4 rounded-lg border border-gold-900/20 hover:bg-gold-500/5 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <code className="text-xs font-mono text-neutral-400">
                          {game.player_address.slice(0, 6)}...{game.player_address.slice(-4)}
                        </code>
                        <ChainBadge chain={game.chain as any} />
                      </div>
                      <div className="text-xs text-neutral-500">
                        {new Date(game.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="text-neutral-400">{game.game_name}</span>
                        <span className="text-neutral-600 mx-2">•</span>
                        <span className="text-neutral-300 font-semibold">
                          {parseFloat(game.bet_amount).toFixed(2)}
                        </span>
                      </div>
                      <div className={`font-bold ${profit > 0 ? 'text-green-400' : 'text-ruby-400'}`}>
                        {profit > 0 ? '+' : ''}
                        {profit.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Weekly Summary */}
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold text-gold-400 uppercase">7-Day Summary</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center p-6">
                <div className="text-sm text-neutral-500 uppercase tracking-wider font-bold mb-2">
                  Wagered
                </div>
                <div className="text-3xl font-black text-gold-400">
                  {formatNumberCompact(parseFloat(stats.weekly_summary.total_wagered))}
                </div>
              </div>
              <div className="text-center p-6">
                <div className="text-sm text-neutral-500 uppercase tracking-wider font-bold mb-2">
                  Paid Out
                </div>
                <div className="text-3xl font-black text-gold-400">
                  {formatNumberCompact(parseFloat(stats.weekly_summary.total_payout))}
                </div>
              </div>
              <div className="text-center p-6">
                <div className="text-sm text-neutral-500 uppercase tracking-wider font-bold mb-2">
                  House Profit
                </div>
                <div className="text-3xl font-black text-green-400">
                  {formatNumberCompact(parseFloat(stats.weekly_summary.house_profit))}
                </div>
                <div className="text-sm text-neutral-500 mt-1">
                  {(
                    (parseFloat(stats.weekly_summary.house_profit) /
                      parseFloat(stats.weekly_summary.total_wagered || '1')) *
                    100
                  ).toFixed(2)}
                  % margin
                </div>
              </div>
              <div className="text-center p-6">
                <div className="text-sm text-neutral-500 uppercase tracking-wider font-bold mb-2">
                  Avg Daily Users
                </div>
                <div className="text-3xl font-black text-gold-400">
                  {stats.weekly_summary.avg_daily_users}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mimir Platform Statistics (All-Time) */}
      {stats.mimir_stats && (
        <div>
          <h2 className="text-2xl font-bold text-gold-400 uppercase mb-4">
            Platform Statistics (All-Time)
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <StatCard
              title="Total Spins"
              value={stats.mimir_stats.total_spins.toLocaleString()}
              subtitle="All-time plays"
              icon={<SlotMachineIcon size={32} />}
            />
            <StatCard
              title="Total Wagered"
              value={formatNumberCompact(parseInt(stats.mimir_stats.total_bet) / 1e6)}
              subtitle="VOI"
              icon={<CoinsIcon size={32} />}
            />
            <StatCard
              title="Total Won"
              value={formatNumberCompact(parseInt(stats.mimir_stats.total_won) / 1e6)}
              subtitle="VOI paid out"
              icon={<TrendingUpIcon size={32} />}
            />
            <StatCard
              title="RTP"
              value={`${stats.mimir_stats.rtp.toFixed(2)}%`}
              subtitle={`House Edge: ${stats.mimir_stats.house_edge.toFixed(2)}%`}
              icon={<ChartIcon size={32} />}
            />
            <StatCard
              title="Win Rate"
              value={`${stats.mimir_stats.win_rate.toFixed(2)}%`}
              subtitle="Winning spins"
              icon={<TrendingUpIcon size={32} />}
            />
            <StatCard
              title="Unique Players"
              value={stats.mimir_stats.unique_players.toLocaleString()}
              subtitle="Total addresses"
              icon={<UsersIcon size={32} />}
            />
            <StatCard
              title="Largest Win"
              value={formatNumberCompact(parseInt(stats.mimir_stats.largest_win) / 1e6)}
              subtitle="VOI"
              icon={<ChartIcon size={32} />}
            />
            <StatCard
              title="Net Result"
              value={formatNumberCompact(parseInt(stats.mimir_stats.net_result) / 1e6)}
              subtitle={parseInt(stats.mimir_stats.net_result) >= 0 ? 'House Profit' : 'House Loss'}
              icon={<ChartIcon size={32} />}
            />
          </div>
        </div>
      )}
    </div>
  );
}
