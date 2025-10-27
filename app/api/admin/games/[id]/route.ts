/**
 * Admin Game Detail API
 * Get, update, or delete a specific game
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/supabaseAdmin';
import { requirePermission, getCurrentProfileId, PERMISSIONS } from '@/lib/auth/admin';
import type { ApiResponse, GameDetail, GameUpdateData } from '@/lib/types/admin';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const profileId = await getCurrentProfileId();
    await requirePermission(PERMISSIONS.VIEW_GAMES, profileId);

    const { id: gameId } = await context.params;
    const supabase = createAdminClient();

    // Get game details
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (gameError || !game) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Game not found' },
        { status: 404 }
      );
    }

    // Get recent plays for this game
    const { data: recentPlays } = await supabase
      .from('game_plays')
      .select(`
        id,
        profile_id,
        bet_amount,
        payout_amount,
        profit_amount,
        created_at,
        profiles (
          accounts (address, chain, is_primary)
        )
      `)
      .eq('game_id', gameId)
      .order('created_at', { ascending: false })
      .limit(20);

    // Get aggregate stats
    const { data: allPlays } = await supabase
      .from('game_plays')
      .select('bet_amount, payout_amount')
      .eq('game_id', gameId);

    const total_plays = allPlays?.length || 0;
    const total_wagered = allPlays?.reduce((sum, p) => sum + parseFloat(p.bet_amount || '0'), 0) || 0;
    const total_payout = allPlays?.reduce((sum, p) => sum + parseFloat(p.payout_amount || '0'), 0) || 0;

    const gameDetail: GameDetail = {
      id: game.id,
      game_type: game.game_type,
      name: game.name,
      description: game.description,
      config: game.config,
      house_edge: game.house_edge,
      min_bet: game.min_bet,
      max_bet: game.max_bet,
      active: game.active,
      created_at: game.created_at,
      updated_at: game.updated_at,
      total_plays,
      total_wagered: total_wagered.toFixed(8),
      total_payout: total_payout.toFixed(8),
      recent_plays: (recentPlays || []).map(play => {
        const accounts = (play.profiles as any)?.accounts || [];
        const primaryAccount = accounts.find((a: any) => a.is_primary) || accounts[0];
        const playerAddress = primaryAccount?.address || 'Unknown';

        return {
          id: play.id,
          profile_id: play.profile_id,
          player_address: playerAddress,
          bet_amount: play.bet_amount,
          payout_amount: play.payout_amount,
          profit_amount: play.profit_amount || '0',
          created_at: play.created_at,
        };
      }),
    };

    return NextResponse.json<ApiResponse<GameDetail>>(
      { success: true, data: gameDetail },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching game detail:', error);

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
    await requirePermission(PERMISSIONS.EDIT_GAMES, profileId);

    const { id: gameId } = await context.params;
    const body: GameUpdateData = await request.json();

    const supabase = createAdminClient();

    // Validate and filter allowed updates
    const allowedUpdates: Partial<GameUpdateData> = {};

    if (body.name !== undefined) allowedUpdates.name = body.name;
    if (body.description !== undefined) allowedUpdates.description = body.description;
    if (body.config !== undefined) allowedUpdates.config = body.config;
    if (body.house_edge !== undefined) allowedUpdates.house_edge = body.house_edge;
    if (body.min_bet !== undefined) allowedUpdates.min_bet = body.min_bet;
    if (body.max_bet !== undefined) allowedUpdates.max_bet = body.max_bet;
    if (body.active !== undefined) allowedUpdates.active = body.active;

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No valid updates provided' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('games')
      .update(allowedUpdates)
      .eq('id', gameId)
      .select()
      .single();

    if (error) {
      console.error('Error updating game:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to update game' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>(
      { success: true, data, message: 'Game updated successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating game:', error);

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

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const profileId = await getCurrentProfileId();
    await requirePermission(PERMISSIONS.DELETE_GAMES, profileId);

    const { id: gameId } = await context.params;
    const supabase = createAdminClient();

    // Soft delete: set active to false instead of actually deleting
    const { data, error } = await supabase
      .from('games')
      .update({ active: false })
      .eq('id', gameId)
      .select()
      .single();

    if (error) {
      console.error('Error deleting game:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to delete game' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>(
      { success: true, data, message: 'Game deactivated successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting game:', error);

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
