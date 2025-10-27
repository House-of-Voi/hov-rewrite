/**
 * Admin Analytics API
 * Mirrors the public statistics data sources so admins see the same live metrics.
 */

import { NextResponse } from 'next/server';
import { requirePermission, getCurrentProfileId, PERMISSIONS } from '@/lib/auth/admin';
import { fetchMachinePerformance } from '@/lib/admin/machine-performance';
import { numberFrom, microToString, microToNumber } from '@/lib/admin/stat-math';
import { getLeaderboard } from '@/lib/mimir/queries';
import type { MimirPlatformStats } from '@/lib/types/database';
import type {
  ApiResponse,
  AnalyticsOverview,
  AnalyticsDailyEntry,
  AnalyticsGameItem,
  AnalyticsPlayerItem,
  AnalyticsChainDistributionItem,
} from '@/lib/types/admin';

const TOP_GAMES_LIMIT = 5;
const TOP_PLAYERS_LIMIT = 10;

export async function GET() {
  try {
    const profileId = await getCurrentProfileId();
    await requirePermission(PERMISSIONS.VIEW_ANALYTICS, profileId);

    const today = new Date();
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const dateRanges: Record<string, { start: Date; end: Date }> = {
      today: { start: startOfToday, end: endOfToday },
      week: { start: new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000), end: endOfToday },
    };

    const dailyKeys: Array<{ key: string; label: string; date: Date }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(startOfToday.getTime() - i * 24 * 60 * 60 * 1000);
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      const label = start.toISOString().split('T')[0];
      const key = `day-${label}`;
      dateRanges[key] = { start, end };
      dailyKeys.push({ key, label, date: start });
    }

    const { machines: machineStats } = await fetchMachinePerformance(dateRanges);

    if (machineStats.length === 0) {
      const empty: AnalyticsOverview = {
        daily: [],
        top_games: [],
        top_players: [],
        chain_distribution: [],
        summary: {
          total_volume: '0',
          total_profit: '0',
          avg_daily_users: 0,
          total_rounds: 0,
          house_edge: 0,
        },
      };

      return NextResponse.json<ApiResponse<AnalyticsOverview>>(
        { success: true, data: empty },
        { status: 200 }
      );
    }

    const dailyEntries: AnalyticsDailyEntry[] = [];
    const chainTotals = new Map<string, { wagered: number; payout: number; profit: number }>();
    const summaryTotals = {
      wagered: 0,
      payout: 0,
      profit: 0,
      rounds: 0,
      users: 0,
      houseEdge: 0,
      winRate: 0,
      machines: 0,
    };

    const topGames: AnalyticsGameItem[] = machineStats
      .map(({ config, allTime }) => {
        if (!allTime) return null;

        const totalWagered = numberFrom(allTime.total_amount_bet);
        const totalPayout = numberFrom(allTime.total_amount_paid);
        const netResult = numberFrom(allTime.net_platform_result ?? (totalWagered - totalPayout));
        const totalRounds = numberFrom(allTime.total_bets);
        const uniquePlayers = numberFrom(allTime.unique_players);

        summaryTotals.wagered += totalWagered;
        summaryTotals.payout += totalPayout;
        summaryTotals.profit += netResult;
        summaryTotals.rounds += totalRounds;
        summaryTotals.users += uniquePlayers;
        summaryTotals.houseEdge += numberFrom(allTime.house_edge);
        summaryTotals.winRate += numberFrom(allTime.win_percentage);
        summaryTotals.machines += 1;

        const chainKey = config.chain ?? 'unknown';
        const chainEntry = chainTotals.get(chainKey) || { wagered: 0, payout: 0, profit: 0 };
        chainEntry.wagered += totalWagered;
        chainEntry.payout += totalPayout;
        chainEntry.profit += netResult;
        chainTotals.set(chainKey, chainEntry);

        return {
          game_id: String(config.contract_id),
          game_name: config.display_name || config.name,
          game_type: 'slots',
          total_wagered: microToString(totalWagered),
          total_payout: microToString(totalPayout),
          house_profit: microToString(netResult),
          total_rounds: totalRounds,
          unique_players: uniquePlayers,
        } satisfies AnalyticsGameItem;
      })
      .filter((item): item is AnalyticsGameItem => item !== null)
      .sort((a, b) => parseFloat(b.total_wagered) - parseFloat(a.total_wagered))
      .slice(0, TOP_GAMES_LIMIT);

    for (const { key, label } of dailyKeys) {
      const totals = {
        wagered: 0,
        payout: 0,
        profit: 0,
        rounds: 0,
        users: 0,
      };

      for (const { statsByRange } of machineStats) {
        const stat = statsByRange[key] as MimirPlatformStats | null;
        if (!stat) continue;

        const wagered = numberFrom(stat.total_amount_bet);
        const payout = numberFrom(stat.total_amount_paid);
        const profit = numberFrom(stat.net_platform_result ?? (wagered - payout));
        const rounds = numberFrom(stat.total_bets);
        const users = numberFrom(stat.unique_players);

        totals.wagered += wagered;
        totals.payout += payout;
        totals.profit += profit;
        totals.rounds += rounds;
        totals.users += users;
      }

      dailyEntries.push({
        date: label,
        total_wagered: microToString(totals.wagered),
        total_payout: microToString(totals.payout),
        house_profit: microToString(totals.profit),
        active_users: totals.users,
        total_rounds: totals.rounds,
      });
    }

    const chain_distribution: AnalyticsChainDistributionItem[] = Array.from(chainTotals.entries())
      .map(([chain, totals]) => ({
        chain: ['voi', 'base', 'solana'].includes(chain) ? (chain as 'voi' | 'base' | 'solana') : 'unknown',
        total_wagered: microToString(totals.wagered),
        total_payout: microToString(totals.payout),
        house_profit: microToString(totals.profit),
        percentage_of_volume: summaryTotals.wagered > 0 ? (totals.wagered / summaryTotals.wagered) * 100 : 0,
      }))
      .sort((a, b) => parseFloat(b.total_wagered) - parseFloat(a.total_wagered));

    const summary = {
      total_volume: microToString(summaryTotals.wagered),
      total_profit: microToString(summaryTotals.profit),
      avg_daily_users: dailyEntries.length > 0
        ? Math.round(dailyEntries.reduce((sum, day) => sum + day.active_users, 0) / dailyEntries.length)
        : 0,
      total_rounds: summaryTotals.rounds,
      house_edge: summaryTotals.wagered > 0
        ? (1 - summaryTotals.payout / summaryTotals.wagered) * 100
        : 0,
    };

    const leaderboard = await getLeaderboard({
      limit: TOP_PLAYERS_LIMIT,
      rankBy: 'volume',
      byProfile: true,
    });

    const top_players: AnalyticsPlayerItem[] = leaderboard.map((entry) => {
      const totalWagered = microToNumber(numberFrom(entry.total_bet));
      const totalWon = microToNumber(numberFrom(entry.total_won));
      const net = microToNumber(numberFrom(entry.net_result));

      return {
        profile_id: entry.identifier,
        display_name: null,
        primary_email: null,
        primary_address: entry.identifier,
        total_wagered: totalWagered.toFixed(6),
        total_payout: totalWon.toFixed(6),
        net_profit: net.toFixed(6),
        wins: numberFrom(entry.total_spins ?? 0) // approximate: spins with payouts? we use total_spins
          ? Math.round(numberFrom(entry.total_spins ?? 0) * (entry.win_rate ?? 0) / 100)
          : 0,
        losses: numberFrom(entry.total_spins ?? 0)
          ? Math.max(0, numberFrom(entry.total_spins ?? 0) - Math.round(numberFrom(entry.total_spins ?? 0) * (entry.win_rate ?? 0) / 100))
          : 0,
        last_play_at: null,
      };
    });

    const analyticsPayload: AnalyticsOverview = {
      daily: dailyEntries,
      top_games: topGames,
      top_players,
      chain_distribution,
      summary,
    };

    return NextResponse.json<ApiResponse<AnalyticsOverview>>(
      { success: true, data: analyticsPayload },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error generating analytics overview:', error);

    if (error instanceof Error && (error.message.includes('UNAUTHORIZED') || error.message.includes('FORBIDDEN'))) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: error.message },
        { status: error.message.includes('UNAUTHORIZED') ? 401 : 403 }
      );
    }

    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
