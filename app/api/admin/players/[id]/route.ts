/**
 * Admin Player Detail API
 * Get, update, or delete a specific player
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/supabaseAdmin';
import { requirePermission, getCurrentProfileId, PERMISSIONS } from '@/lib/auth/admin';
import { getPlayerStats } from '@/lib/mimir/queries';
import type { ApiResponse, PlayerDetail, PlayerUpdateData } from '@/lib/types/admin';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const profileId = await getCurrentProfileId();
    await requirePermission(PERMISSIONS.VIEW_PLAYERS, profileId);

    const { id: playerId } = await context.params;
    const supabase = createAdminClient();

    // Get player profile with accounts
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        primary_email,
        display_name,
        avatar_url,
        max_referrals,
        game_access_granted,
        waitlist_position,
        waitlist_joined_at,
        created_at,
        updated_at,
        accounts (
          chain,
          address,
          is_primary
        )
      `)
      .eq('id', playerId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Player not found' },
        { status: 404 }
      );
    }

    // Get referral stats
    const { data: referrals } = await supabase
      .from('referrals')
      .select('id, is_active')
      .eq('referrer_profile_id', playerId);

    const referrals_count = referrals?.length || 0;
    const active_referrals_count = referrals?.filter(r => r.is_active).length || 0;

    // Get referral credits earned
    const { data: credits } = await supabase
      .from('referral_credits')
      .select('credit_earned')
      .eq('referrer_profile_id', playerId);

    const referral_credits_earned = credits?.reduce((sum, c) => sum + parseFloat(c.credit_earned), 0) || 0;

    // Get game plays for local stats
    const { data: plays } = await supabase
      .from('game_plays')
      .select('bet_amount, payout_amount, created_at')
      .eq('profile_id', playerId);

    const total_plays = plays?.length || 0;
    const total_wagered = plays?.reduce((sum, p) => sum + parseFloat(p.bet_amount), 0) || 0;
    const last_play_at = plays?.[0]?.created_at || null;

    // Get Mimir stats for each account
    let mimirStats = {
      total_spins: 0,
      total_bet: '0',
      total_won: '0',
      net_result: '0',
      win_rate: 0,
      largest_win: '0',
    };

    if (profile.accounts && profile.accounts.length > 0) {
      try {
        // Aggregate stats across all player addresses
        for (const account of profile.accounts) {
          try {
            // Note: getPlayerStats expects contractId, not chain
            // For now, we'll skip Mimir stats or you can pass a contractId if available
            const playerStats = await getPlayerStats(account.address);

            if (playerStats) {
              mimirStats.total_spins += playerStats.total_spins || 0;
              mimirStats.total_bet = (parseFloat(mimirStats.total_bet) + parseFloat(playerStats.total_bet || '0')).toString();
              mimirStats.total_won = (parseFloat(mimirStats.total_won) + parseFloat(playerStats.total_won || '0')).toString();

              const largestWin = parseFloat(playerStats.largest_win || '0');
              if (largestWin > parseFloat(mimirStats.largest_win)) {
                mimirStats.largest_win = largestWin.toString();
              }
            }
          } catch (err) {
            console.warn(`Failed to fetch Mimir stats for ${account.chain}:${account.address}`, err);
          }
        }

        // Calculate net result and win rate
        const totalBet = parseFloat(mimirStats.total_bet);
        const totalWon = parseFloat(mimirStats.total_won);
        mimirStats.net_result = (totalWon - totalBet).toString();
        mimirStats.win_rate = mimirStats.total_spins > 0
          ? (totalWon / totalBet) * 100
          : 0;
      } catch (error) {
        console.error('Error fetching Mimir stats:', error);
        // Continue with empty stats
      }
    }

    const playerDetail: PlayerDetail = {
      id: profile.id,
      primary_email: profile.primary_email,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      max_referrals: profile.max_referrals,
      game_access_granted: profile.game_access_granted,
      waitlist_position: profile.waitlist_position,
      waitlist_joined_at: profile.waitlist_joined_at,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      total_plays,
      total_wagered: total_wagered.toFixed(8),
      last_play_at,
      referrals_count,
      active_referrals_count,
      referral_credits_earned: referral_credits_earned.toFixed(8),
      accounts: (profile.accounts || []).map((a: any) => ({
        chain: a.chain,
        address: a.address,
        is_primary: a.is_primary,
      })),
      game_stats: mimirStats,
    };

    return NextResponse.json<ApiResponse<PlayerDetail>>(
      { success: true, data: playerDetail },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching player detail:', error);

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

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const profileId = await getCurrentProfileId();
    await requirePermission(PERMISSIONS.EDIT_PLAYERS, profileId);

    const { id: playerId } = await context.params;
    const body: PlayerUpdateData = await request.json();

    const supabase = createAdminClient();

    // Validate and filter allowed updates
    const allowedUpdates: Partial<PlayerUpdateData> = {};

    if (body.primary_email !== undefined) allowedUpdates.primary_email = body.primary_email;
    if (body.display_name !== undefined) allowedUpdates.display_name = body.display_name;
    if (body.avatar_url !== undefined) allowedUpdates.avatar_url = body.avatar_url;
    if (body.max_referrals !== undefined) allowedUpdates.max_referrals = body.max_referrals;
    if (body.game_access_granted !== undefined) allowedUpdates.game_access_granted = body.game_access_granted;
    if (body.waitlist_position !== undefined) allowedUpdates.waitlist_position = body.waitlist_position;

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No valid updates provided' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(allowedUpdates)
      .eq('id', playerId)
      .select()
      .single();

    if (error) {
      console.error('Error updating player:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to update player' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>(
      { success: true, data, message: 'Player updated successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating player:', error);

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
