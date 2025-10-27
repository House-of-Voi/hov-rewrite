/**
 * Admin Games API
 * List all games and create new games
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/supabaseAdmin';
import { requirePermission, getCurrentProfileId, PERMISSIONS } from '@/lib/auth/admin';
import type { ApiResponse, PaginatedResponse, GameListItem, GameFilters, GameCreateData } from '@/lib/types/admin';

export async function GET(request: NextRequest) {
  try {
    const profileId = await getCurrentProfileId();
    await requirePermission(PERMISSIONS.VIEW_GAMES, profileId);

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const filters: GameFilters = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '50'), 100),
      game_type: (searchParams.get('game_type') as 'slots' | 'keno' | 'roulette') || undefined,
      active: searchParams.get('active') === 'true' ? true :
              searchParams.get('active') === 'false' ? false : undefined,
      sort_by: searchParams.get('sort_by') || 'created_at',
      sort_order: (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc',
    };

    const supabase = createAdminClient();
    const offset = (filters.page! - 1) * filters.limit!;

    // Build query
    let query = supabase
      .from('games')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters.game_type) {
      query = query.eq('game_type', filters.game_type);
    }

    if (filters.active !== undefined) {
      query = query.eq('active', filters.active);
    }

    // Apply sorting
    query = query.order(filters.sort_by!, { ascending: filters.sort_order === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + filters.limit! - 1);

    const { data: games, error, count } = await query;

    if (error) {
      console.error('Error fetching games:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to fetch games' },
        { status: 500 }
      );
    }

    // Get play stats for each game
    const gameIds = games?.map(g => g.id) || [];
    const { data: playStats } = await supabase
      .from('game_plays')
      .select('game_id, bet_amount, payout_amount')
      .in('game_id', gameIds);

    // Aggregate stats by game
    const statsMap = new Map<string, { total_plays: number; total_wagered: number; total_payout: number }>();
    playStats?.forEach(play => {
      const current = statsMap.get(play.game_id) || { total_plays: 0, total_wagered: 0, total_payout: 0 };
      current.total_plays++;
      current.total_wagered += parseFloat(play.bet_amount || '0');
      current.total_payout += parseFloat(play.payout_amount || '0');
      statsMap.set(play.game_id, current);
    });

    // Format response
    const gamesList: GameListItem[] = (games || []).map(game => {
      const stats = statsMap.get(game.id);
      return {
        id: game.id,
        game_type: game.game_type,
        name: game.name,
        description: game.description,
        house_edge: game.house_edge,
        min_bet: game.min_bet,
        max_bet: game.max_bet,
        active: game.active,
        created_at: game.created_at,
        updated_at: game.updated_at,
        total_plays: stats?.total_plays || 0,
        total_wagered: stats?.total_wagered.toFixed(8) || '0.00000000',
        total_payout: stats?.total_payout.toFixed(8) || '0.00000000',
      };
    });

    const response: PaginatedResponse<GameListItem> = {
      data: gamesList,
      pagination: {
        page: filters.page!,
        limit: filters.limit!,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / filters.limit!),
      },
    };

    return NextResponse.json<ApiResponse<PaginatedResponse<GameListItem>>>(
      { success: true, data: response },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in games API:', error);

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

export async function POST(request: NextRequest) {
  try {
    const profileId = await getCurrentProfileId();
    await requirePermission(PERMISSIONS.CREATE_GAMES, profileId);

    const body: GameCreateData = await request.json();

    // Validate required fields
    if (!body.game_type || !body.name) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'game_type and name are required' },
        { status: 400 }
      );
    }

    // Validate game type
    if (!['slots', 'keno', 'roulette'].includes(body.game_type)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid game_type' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const newGame = {
      game_type: body.game_type,
      name: body.name,
      description: body.description || null,
      config: body.config || {},
      house_edge: body.house_edge || 0.02,
      min_bet: body.min_bet || 0.001,
      max_bet: body.max_bet || 100,
      active: body.active !== undefined ? body.active : true,
    };

    const { data, error } = await supabase
      .from('games')
      .insert(newGame)
      .select()
      .single();

    if (error) {
      console.error('Error creating game:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to create game' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>(
      { success: true, data, message: 'Game created successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating game:', error);

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
