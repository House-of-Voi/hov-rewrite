'use client';

import { useEffect, useMemo, useState } from 'react';
import Card, { CardContent, CardHeader } from '@/components/Card';
import { TrendingUpIcon, UsersIcon, CoinsIcon, ChartIcon } from '@/components/icons';
import ChainBadge from '@/components/ChainBadge';
import type { AnalyticsOverview } from '@/lib/types/admin';
import { formatNumberCompact } from '@/lib/utils/format';

interface ApiResult {
  success: boolean;
  data?: AnalyticsOverview;
  error?: string;
}

const AUTO_REFRESH_INTERVAL_MS = 60_000;

const truncateAddress = (address: string | null) => {
  if (!address) return '—';
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
};

export default function AnalyticsClient() {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(() => fetchAnalytics(true), AUTO_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async (background = false) => {
    try {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
        setError(null);
      }

      const response = await fetch('/api/admin/analytics', {
        cache: 'no-store',
      });
      const body: ApiResult = await response.json();

      if (body.success && body.data) {
        setAnalytics(body.data);
      } else {
        setError(body.error || 'Failed to load analytics');
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics');
    } finally {
      if (background) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const maxDailyWagered = useMemo(() => {
    if (!analytics) return 0;
    return Math.max(
      0,
      ...analytics.daily.map((day) => Number.parseFloat(day.total_wagered))
    );
  }, [analytics]);

  if (loading) {
    return (
      <div className="text-center py-12 text-neutral-600 dark:text-neutral-400">
        Loading analytics…
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <Card>
        <CardContent>
          <div className="p-6 text-error-600 dark:text-error-400">{error || 'Unable to load analytics'}</div>
          <button
            onClick={() => fetchAnalytics(false)}
            className="mt-4 px-4 py-2 bg-warning-500 text-white rounded-lg font-semibold hover:bg-warning-400 transition-colors"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-warning-500 dark:text-warning-400 neon-text uppercase">Analytics</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2">
            Detailed performance metrics and insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            className={`px-4 py-2 text-sm border-2 rounded-lg font-medium transition-colors ${
              refreshing
                ? 'border-neutral-300 dark:border-neutral-700 text-neutral-500 dark:text-neutral-500 cursor-not-allowed'
                : 'border-warning-500/30 text-warning-600 dark:text-warning-400 hover:bg-warning-500/10'
            }`}
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <a href="/admin">
            <button className="px-4 py-2 text-sm border-2 border-warning-500/30 text-warning-600 dark:text-warning-400 rounded-lg hover:bg-warning-500/10 transition-colors font-bold uppercase tracking-wide">
              ← Dashboard
            </button>
          </a>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card glow>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-neutral-600 dark:text-neutral-500 uppercase tracking-wider font-bold">
                7-Day Volume
              </div>
              <TrendingUpIcon size={24} className="text-warning-500 dark:text-warning-400" />
            </div>
            <div className="text-3xl font-black text-warning-500 dark:text-warning-400">
              {formatNumberCompact(Number(analytics.summary.total_volume))} VOI
            </div>
            <div className="text-xs text-success-600 dark:text-success-400 mt-2">
              House edge {analytics.summary.house_edge.toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card glow>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-neutral-600 dark:text-neutral-500 uppercase tracking-wider font-bold">
                7-Day Profit
              </div>
              <CoinsIcon size={24} className="text-warning-500 dark:text-warning-400" />
            </div>
            <div className="text-3xl font-black text-success-600 dark:text-success-400">
              {formatNumberCompact(Number(analytics.summary.total_profit))} VOI
            </div>
            <div className="text-xs text-neutral-600 dark:text-neutral-500 mt-2">
              Across {analytics.summary.total_rounds.toLocaleString()} rounds
            </div>
          </CardContent>
        </Card>

        <Card glow>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-neutral-600 dark:text-neutral-500 uppercase tracking-wider font-bold">
                Avg Daily Users
              </div>
              <UsersIcon size={24} className="text-warning-500 dark:text-warning-400" />
            </div>
            <div className="text-3xl font-black text-warning-500 dark:text-warning-400">
              {analytics.summary.avg_daily_users.toLocaleString()}
            </div>
            <div className="text-xs text-neutral-600 dark:text-neutral-500 mt-2">
              Last 7 days
            </div>
          </CardContent>
        </Card>

        <Card glow>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-neutral-600 dark:text-neutral-500 uppercase tracking-wider font-bold">
                Total Rounds
              </div>
              <ChartIcon size={24} className="text-warning-500 dark:text-warning-400" />
            </div>
            <div className="text-3xl font-black text-warning-500 dark:text-warning-400">
              {analytics.summary.total_rounds.toLocaleString()}
            </div>
            <div className="text-xs text-neutral-600 dark:text-neutral-500 mt-2">
              30-day trend available below
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Performance */}
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-warning-500 dark:text-warning-400 uppercase">Daily Performance (7 Days)</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.daily.map((day) => {
              const wagered = Number.parseFloat(day.total_wagered);
              const profit = Number.parseFloat(day.house_profit);
              const barWidth = maxDailyWagered > 0 ? (wagered / maxDailyWagered) * 100 : 0;

              return (
                <div key={day.date} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4 w-48">
                      <span className="text-neutral-600 dark:text-neutral-400 font-mono text-xs">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-neutral-600 dark:text-neutral-500">{day.active_users} users</span>
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="h-8 bg-neutral-100 dark:bg-neutral-900 rounded-lg overflow-hidden border border-warning-200 dark:border-warning-900/20">
                        <div
                          className="h-full bg-gradient-to-r from-warning-500 to-warning-600 flex items-center px-3 transition-all"
                          style={{ width: `${barWidth}%` }}
                        >
                          <span className="text-xs font-bold text-white whitespace-nowrap">
                            {formatNumberCompact(wagered)} VOI
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right w-32">
                      <div className={`font-bold ${profit >= 0 ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'}`}>
                        {profit >= 0 ? '+' : ''}
                        {formatNumberCompact(profit)} VOI
                      </div>
                      <div className="text-xs text-neutral-600 dark:text-neutral-500">
                        {wagered > 0 ? ((profit / wagered) * 100).toFixed(1) : '0.0'}% edge
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Game Performance & Chain Distribution */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Games */}
        <Card>
          <CardHeader>
            <h3 className="text-xl font-bold text-warning-500 dark:text-warning-400 uppercase">Game Performance</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.top_games.length === 0 ? (
              <div className="text-neutral-600 dark:text-neutral-500 text-sm">No gameplay recorded in the last 30 days.</div>
            ) : (
              analytics.top_games.map((game) => {
                const wagered = Number.parseFloat(game.total_wagered);
                const profit = Number.parseFloat(game.house_profit);
                return (
                  <div key={game.game_id} className="p-4 rounded-lg border border-warning-200 dark:border-warning-900/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-3">
                        <span className="uppercase text-xs tracking-widest text-warning-600 dark:text-warning-500">{game.game_type}</span>
                        <span>{game.game_name}</span>
                      </div>
                      <div className={`text-lg font-bold ${profit >= 0 ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'}`}>
                        {formatNumberCompact(profit)} VOI
                      </div>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                      <div>
                        <div className="text-neutral-600 dark:text-neutral-500 uppercase">Wagered</div>
                        <div className="text-neutral-700 dark:text-neutral-300 font-semibold">{formatNumberCompact(wagered)} VOI</div>
                      </div>
                      <div>
                        <div className="text-neutral-600 dark:text-neutral-500 uppercase">Payout</div>
                        <div className="text-neutral-700 dark:text-neutral-300 font-semibold">
                          {formatNumberCompact(Number(game.total_payout))} VOI
                        </div>
                      </div>
                      <div>
                        <div className="text-neutral-600 dark:text-neutral-500 uppercase">Rounds</div>
                        <div className="text-neutral-700 dark:text-neutral-300 font-semibold">
                          {game.total_rounds.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-neutral-600 dark:text-neutral-500 uppercase">Players</div>
                        <div className="text-neutral-700 dark:text-neutral-300 font-semibold">
                          {game.unique_players.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Chain Distribution */}
        <Card>
          <CardHeader>
            <h3 className="text-xl font-bold text-warning-500 dark:text-warning-400 uppercase">Chain Distribution</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.chain_distribution.length === 0 ? (
              <div className="text-neutral-600 dark:text-neutral-500 text-sm">No activity recorded in the selected window.</div>
            ) : (
              analytics.chain_distribution.map((item) => (
                <div key={item.chain} className="p-4 rounded-lg border border-warning-200 dark:border-warning-900/20">
                  <div className="flex items-center justify-between mb-3">
                    <ChainBadge chain={item.chain === 'unknown' ? undefined : item.chain} />
                    <div className="text-sm text-neutral-600 dark:text-neutral-500 uppercase">
                      {item.percentage_of_volume.toFixed(1)}% of volume
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-neutral-600 dark:text-neutral-500 uppercase">Wagered</div>
                      <div className="text-neutral-700 dark:text-neutral-300 font-semibold">{formatNumberCompact(Number(item.total_wagered))} VOI</div>
                    </div>
                    <div>
                      <div className="text-neutral-600 dark:text-neutral-500 uppercase">Payout</div>
                      <div className="text-neutral-700 dark:text-neutral-300 font-semibold">{formatNumberCompact(Number(item.total_payout))} VOI</div>
                    </div>
                    <div>
                      <div className="text-neutral-600 dark:text-neutral-500 uppercase">Profit</div>
                      <div className={`font-semibold ${Number(item.house_profit) >= 0 ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'}`}>
                        {formatNumberCompact(Number(item.house_profit))} VOI
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Players */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-bold text-warning-500 dark:text-warning-400 uppercase">Top Players (All Time)</h3>
        </CardHeader>
        <CardContent>
          {analytics.top_players.length === 0 ? (
            <div className="text-neutral-600 dark:text-neutral-500 text-sm">No player activity recorded.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-neutral-600 dark:text-neutral-500 uppercase tracking-wider text-xs border-b border-warning-200 dark:border-warning-900/20">
                    <th className="py-3 pr-4 font-semibold">Player</th>
                    <th className="py-3 pr-4 font-semibold">Email</th>
                    <th className="py-3 pr-4 font-semibold">Address</th>
                    <th className="py-3 pr-4 font-semibold text-right">Wagered (VOI)</th>
                    <th className="py-3 pr-4 font-semibold text-right">Payout (VOI)</th>
                    <th className="py-3 pr-4 font-semibold text-right">Net (VOI)</th>
                    <th className="py-3 pr-4 font-semibold text-right">Wins</th>
                    <th className="py-3 pr-4 font-semibold text-right">Losses</th>
                    <th className="py-3 font-semibold">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warning-200/20 dark:divide-warning-900/10">
                  {analytics.top_players.map((player, index) => {
                    const net = Number.parseFloat(player.net_profit);
                    const rowKey =
                      player.profile_id ??
                      `${player.primary_address ?? player.primary_email ?? 'player'}-${index}`;
                    return (
                      <tr key={rowKey} className="text-neutral-800 dark:text-neutral-200">
                        <td className="py-3 pr-4">
                          {player.display_name || 'Anonymous'}
                        </td>
                        <td className="py-3 pr-4 text-neutral-600 dark:text-neutral-400">
                          {player.primary_email || '—'}
                        </td>
                        <td className="py-3 pr-4 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                          {truncateAddress(player.primary_address)}
                        </td>
                        <td className="py-3 pr-4 text-right">
                          {formatNumberCompact(Number(player.total_wagered))} VOI
                        </td>
                        <td className="py-3 pr-4 text-right">
                          {formatNumberCompact(Number(player.total_payout))} VOI
                        </td>
                        <td className={`py-3 pr-4 text-right font-semibold ${net >= 0 ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'}`}>
                          {net >= 0 ? '+' : ''}
                          {formatNumberCompact(net)} VOI
                        </td>
                        <td className="py-3 pr-4 text-right">
                          {player.wins}
                        </td>
                        <td className="py-3 pr-4 text-right">
                          {player.losses}
                        </td>
                        <td className="py-3 text-neutral-600 dark:text-neutral-400">
                          {player.last_play_at
                            ? new Date(player.last_play_at).toLocaleString()
                            : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
