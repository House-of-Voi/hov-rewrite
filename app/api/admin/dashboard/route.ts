/**
 * Admin Dashboard API
 * Reuses the public statistics data sources (Mimir + slot machine configs)
 * so the admin views show the same real numbers as the public stats page.
 */

import { NextResponse } from 'next/server';
import { requirePermission, getCurrentProfileId, PERMISSIONS } from '@/lib/auth/admin';
import { aggregateByChain, aggregateByGameType, calculateGrandTotal } from '@/lib/admin/treasury-aggregation';
import { fetchMachinePerformance } from '@/lib/admin/machine-performance';
import { numberFrom, microToString } from '@/lib/admin/stat-math';
import type { ApiResponse, DashboardStats, TreasuryItem } from '@/lib/types/admin';

export async function GET() {
  try {
    const profileId = await getCurrentProfileId();
    await requirePermission(PERMISSIONS.VIEW_ANALYTICS, profileId);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 6); // include today + previous 6 days

    const { machines: machineStats } = await fetchMachinePerformance({
      today: { start: startOfToday, end: endOfToday },
      week: { start: startOfWeek, end: endOfToday },
    });

    if (machineStats.length === 0) {
      const emptyStats: DashboardStats = {
        treasuries: [],
        chain_totals: [],
        game_type_totals: [],
        grand_total: { total_balance: '0', total_reserved: '0', total_available: '0', total_machines: 0 },
        today: { total_wagered: '0', total_payout: '0', house_profit: '0', active_users: 0, total_rounds: 0 },
        weekly_summary: { total_wagered: '0', total_payout: '0', house_profit: '0', avg_daily_users: 0, total_rounds: 0 },
        live_feed: [],
        mimir_stats: null,
      };
      return NextResponse.json<ApiResponse<DashboardStats>>(
        { success: true, data: emptyStats },
        { status: 200 }
      );
    }

    const treasuries: TreasuryItem[] = [];
    const dailyTotals = {
      wagered: 0,
      payout: 0,
      profit: 0,
      users: 0,
      rounds: 0,
    };
    const weeklyTotals = {
      wagered: 0,
      payout: 0,
      profit: 0,
      users: 0,
      rounds: 0,
      days: 0,
    };
    const aggregate = {
      total_spins: 0,
      total_bet: 0,
      total_won: 0,
      net_result: 0,
      win_rate: 0,
      house_edge: 0,
      unique_players: 0,
      largest_win: 0,
      machines: 0,
    };

    for (const entry of machineStats) {
      const { config: machine, allTime: allTimeStat, statsByRange } = entry;
      if (!allTimeStat) {
        continue;
      }

      const totalBet = numberFrom(allTimeStat.total_amount_bet);
      const totalWon = numberFrom(allTimeStat.total_amount_paid);
      const netResult = numberFrom(allTimeStat.net_platform_result ?? (totalBet - totalWon));

      treasuries.push({
        contract_id: Number(machine.contract_id),
        chain: (machine.chain as TreasuryItem['chain']) ?? 'voi',
        game_type: 'slots',
        game_name: machine.display_name || machine.name || `Contract ${machine.contract_id}`,
        balance: microToString(totalBet),
        reserved: microToString(totalWon),
        available: microToString(netResult),
        updated_at: new Date().toISOString(),
      });

      aggregate.total_spins += numberFrom(allTimeStat.total_bets);
      aggregate.total_bet += totalBet;
      aggregate.total_won += totalWon;
      aggregate.net_result += netResult;
      aggregate.win_rate += numberFrom(allTimeStat.win_percentage);
      aggregate.house_edge += numberFrom(allTimeStat.house_edge);
      aggregate.unique_players += numberFrom(allTimeStat.unique_players);
      aggregate.largest_win = Math.max(aggregate.largest_win, numberFrom(allTimeStat.largest_single_win));
      aggregate.machines += 1;

      const dailyStat = statsByRange.today ?? null;
      if (dailyStat) {
        const wagered = numberFrom(dailyStat.total_amount_bet);
        const payout = numberFrom(dailyStat.total_amount_paid);
        const profit = numberFrom(dailyStat.net_platform_result ?? (wagered - payout));
        dailyTotals.wagered += wagered;
        dailyTotals.payout += payout;
        dailyTotals.profit += profit;
        dailyTotals.users += numberFrom(dailyStat.unique_players);
        dailyTotals.rounds += numberFrom(dailyStat.total_bets);
      }

      const weeklyStat = statsByRange.week ?? null;
      if (weeklyStat) {
        const wagered = numberFrom(weeklyStat.total_amount_bet);
        const payout = numberFrom(weeklyStat.total_amount_paid);
        const profit = numberFrom(weeklyStat.net_platform_result ?? (wagered - payout));
        weeklyTotals.wagered += wagered;
        weeklyTotals.payout += payout;
        weeklyTotals.profit += profit;
        weeklyTotals.users += numberFrom(weeklyStat.unique_players);
        weeklyTotals.rounds += numberFrom(weeklyStat.total_bets);
        weeklyTotals.days = 7;
      }
    }

    const chain_totals = aggregateByChain(treasuries);
    const game_type_totals = aggregateByGameType(treasuries);
    const grand_total = calculateGrandTotal(treasuries);

    const todayAgg = {
      total_wagered: microToString(dailyTotals.wagered),
      total_payout: microToString(dailyTotals.payout),
      house_profit: microToString(dailyTotals.profit),
      active_users: dailyTotals.users,
      total_rounds: dailyTotals.rounds,
    };

    const weeklyAgg = {
      total_wagered: microToString(weeklyTotals.wagered),
      total_payout: microToString(weeklyTotals.payout),
      house_profit: microToString(weeklyTotals.profit),
      avg_daily_users:
        weeklyTotals.days > 0 ? Math.round(weeklyTotals.users / weeklyTotals.days) : 0,
      total_rounds: weeklyTotals.rounds,
    };

    const totalBetMicro = aggregate.total_bet;
    const totalWonMicro = aggregate.total_won;
    const rtp = totalBetMicro > 0 ? (totalWonMicro / totalBetMicro) * 100 : 0;
    const houseEdge =
      aggregate.machines > 0
        ? aggregate.house_edge / aggregate.machines
        : 100 - rtp;
    const mimirStats =
      aggregate.machines > 0
        ? {
            total_spins: aggregate.total_spins,
            total_bet: aggregate.total_bet.toString(),
            total_won: aggregate.total_won.toString(),
            net_result: aggregate.net_result.toString(),
            rtp,
            win_rate: aggregate.win_rate / aggregate.machines,
            house_edge: houseEdge,
            unique_players: aggregate.unique_players,
            largest_win: aggregate.largest_win.toString(),
          }
        : null;

    const live_feed: DashboardStats['live_feed'] = [];

    const dashboardStats: DashboardStats = {
      treasuries,
      chain_totals,
      game_type_totals,
      grand_total,
      today: todayAgg,
      weekly_summary: weeklyAgg,
      live_feed,
      mimir_stats: mimirStats,
    };

    return NextResponse.json<ApiResponse<DashboardStats>>(
      { success: true, data: dashboardStats },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error fetching dashboard stats:', error);

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
