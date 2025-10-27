/**
 * Admin Dashboard API
 * Provides aggregated statistics for the admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/supabaseAdmin';
import { requirePermission, getCurrentProfileId, PERMISSIONS } from '@/lib/auth/admin';
import { aggregateByChain, aggregateByGameType, calculateGrandTotal, formatTreasuryItems } from '@/lib/admin/treasury-aggregation';
import { getPlatformStats } from '@/lib/mimir/queries';
import { env } from '@/lib/utils/env';
import type { ApiResponse, DashboardStats } from '@/lib/types/admin';

export async function GET(request: NextRequest) {
  try {
    const profileId = await getCurrentProfileId();
    await requirePermission(PERMISSIONS.VIEW_ANALYTICS, profileId);

    const supabase = createAdminClient();

    // Get all treasury balances (per machine)
    const { data: treasuryData } = await supabase
      .from('treasury_balances')
      .select('*')
      .order('game_name', { ascending: true });

    // Format treasury items with calculated available balance
    const treasuries = formatTreasuryItems(treasuryData || []);

    // Calculate aggregations
    const chain_totals = aggregateByChain(treasuries);
    const game_type_totals = aggregateByGameType(treasuries);
    const grand_total = calculateGrandTotal(treasuries);

    // Get today's date for filtering
    const today = new Date().toISOString().split('T')[0];

    // Get today's stats from daily_stats table
    const { data: todayStats } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('date', today);

    // Aggregate today's stats across all chains
    const todayAgg = {
      total_wagered: '0',
      total_payout: '0',
      house_profit: '0',
      active_users: 0,
      total_rounds: 0,
    };

    if (todayStats && todayStats.length > 0) {
      todayStats.forEach(stat => {
        todayAgg.total_wagered = (
          parseFloat(todayAgg.total_wagered) + parseFloat(stat.total_wagered || '0')
        ).toFixed(8);
        todayAgg.total_payout = (
          parseFloat(todayAgg.total_payout) + parseFloat(stat.total_payout || '0')
        ).toFixed(8);
        todayAgg.house_profit = (
          parseFloat(todayAgg.house_profit) + parseFloat(stat.house_profit || '0')
        ).toFixed(8);
        todayAgg.active_users += stat.active_users || 0;
        todayAgg.total_rounds += stat.total_rounds || 0;
      });
    } else {
      // If no daily stats, calculate from game_plays table for today
      const startOfToday = new Date(today + 'T00:00:00Z').toISOString();
      const { data: todayPlays } = await supabase
        .from('game_plays')
        .select('profile_id, bet_amount, payout_amount')
        .gte('created_at', startOfToday);

      if (todayPlays && todayPlays.length > 0) {
        const uniqueUsers = new Set(todayPlays.map(p => p.profile_id));
        todayAgg.active_users = uniqueUsers.size;
        todayAgg.total_rounds = todayPlays.length;

        todayPlays.forEach(play => {
          todayAgg.total_wagered = (
            parseFloat(todayAgg.total_wagered) + parseFloat(play.bet_amount || '0')
          ).toFixed(8);
          todayAgg.total_payout = (
            parseFloat(todayAgg.total_payout) + parseFloat(play.payout_amount || '0')
          ).toFixed(8);
        });

        todayAgg.house_profit = (
          parseFloat(todayAgg.total_wagered) - parseFloat(todayAgg.total_payout)
        ).toFixed(8);
      }
    }

    // Get weekly stats (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    const { data: weekStats } = await supabase
      .from('daily_stats')
      .select('*')
      .gte('date', weekAgoStr);

    const weeklyAgg = {
      total_wagered: '0',
      total_payout: '0',
      house_profit: '0',
      avg_daily_users: 0,
      total_rounds: 0,
    };

    if (weekStats && weekStats.length > 0) {
      let totalUsers = 0;
      weekStats.forEach(stat => {
        weeklyAgg.total_wagered = (
          parseFloat(weeklyAgg.total_wagered) + parseFloat(stat.total_wagered || '0')
        ).toFixed(8);
        weeklyAgg.total_payout = (
          parseFloat(weeklyAgg.total_payout) + parseFloat(stat.total_payout || '0')
        ).toFixed(8);
        weeklyAgg.house_profit = (
          parseFloat(weeklyAgg.house_profit) + parseFloat(stat.house_profit || '0')
        ).toFixed(8);
        totalUsers += stat.active_users || 0;
        weeklyAgg.total_rounds += stat.total_rounds || 0;
      });
      weeklyAgg.avg_daily_users = Math.round(totalUsers / weekStats.length);
    }

    // Get recent game plays for live feed (last 50)
    const { data: recentPlays } = await supabase
      .from('game_plays')
      .select(`
        id,
        profile_id,
        bet_amount,
        payout_amount,
        profit_amount,
        chain,
        created_at,
        game_id,
        games (name, game_type),
        profiles (
          accounts (address, chain, is_primary)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    const live_feed = (recentPlays || []).map(play => {
      // Get primary account or first account
      const accounts = (play.profiles as any)?.accounts || [];
      const primaryAccount = accounts.find((a: any) => a.is_primary) || accounts[0];
      const playerAddress = primaryAccount?.address || 'Unknown';

      const game = (play.games as any) || {};

      return {
        id: play.id,
        player_address: playerAddress,
        game_name: game.name || 'Unknown Game',
        game_type: game.game_type || 'unknown',
        chain: play.chain,
        bet_amount: play.bet_amount,
        payout_amount: play.payout_amount,
        profit_amount: play.profit_amount || '0',
        created_at: play.created_at,
      };
    });

    // Fetch Mimir platform stats for all Voi slot machines if configured
    let mimirStats = null;
    if (env.MIMIR_SUPABASE_URL && env.MIMIR_SUPABASE_ANON_KEY) {
      try {
        // Get all active Voi slot machines from slot_machine_configs (source of truth)
        const { data: slotMachines } = await supabase
          .from('slot_machine_configs')
          .select('contract_id')
          .eq('chain', 'voi')
          .eq('is_active', true);

        if (slotMachines && slotMachines.length > 0) {
          // Fetch stats for each slot machine and aggregate
          const statsPromises = slotMachines.map(async (machine) => {
            try {
              const appId = Number(machine.contract_id);
              if (isNaN(appId) || appId <= 0) return null;

              const contractStats = await getPlatformStats(appId);
              return contractStats && contractStats.length > 0 ? contractStats[0] : null;
            } catch (error) {
              console.warn(`Failed to fetch stats for contract ${machine.contract_id}:`, error);
              return null;
            }
          });

          const allStats = (await Promise.all(statsPromises)).filter(s => s !== null);

          if (allStats.length > 0) {
            // Aggregate stats across all slot machines
            const aggregated = allStats.reduce((acc, stats) => ({
              total_spins: acc.total_spins + stats.total_spins,
              total_bet: (BigInt(acc.total_bet) + BigInt(stats.total_bet)).toString(),
              total_won: (BigInt(acc.total_won) + BigInt(stats.total_won)).toString(),
              net_result: (BigInt(acc.net_result) + BigInt(stats.net_result)).toString(),
              win_rate: acc.win_rate + stats.win_rate,
              unique_players: acc.unique_players + stats.unique_players,
              largest_win: BigInt(stats.largest_win) > BigInt(acc.largest_win) ? stats.largest_win : acc.largest_win,
            }), {
              total_spins: 0,
              total_bet: '0',
              total_won: '0',
              net_result: '0',
              win_rate: 0,
              unique_players: 0,
              largest_win: '0',
            });

            // Calculate aggregate RTP and house edge
            const totalBet = BigInt(aggregated.total_bet);
            const totalWon = BigInt(aggregated.total_won);
            const rtp = totalBet > 0n ? (Number(totalWon) / Number(totalBet)) * 100 : 0;
            const house_edge = 100 - rtp;
            const avg_win_rate = allStats.length > 0 ? aggregated.win_rate / allStats.length : 0;

            mimirStats = {
              total_spins: aggregated.total_spins,
              total_bet: aggregated.total_bet,
              total_won: aggregated.total_won,
              net_result: aggregated.net_result,
              rtp,
              win_rate: avg_win_rate,
              house_edge,
              unique_players: aggregated.unique_players,
              largest_win: aggregated.largest_win,
            };
          }
        }
      } catch (error) {
        console.warn('Failed to fetch Mimir platform stats:', error);
        // Continue without Mimir stats
      }
    }

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
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);

    if (error.message?.includes('UNAUTHORIZED') || error.message?.includes('FORBIDDEN')) {
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
