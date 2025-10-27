/**
 * Admin Games API
 * List all games and create new games
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/supabaseAdmin';
import { requirePermission, getCurrentProfileId, PERMISSIONS } from '@/lib/auth/admin';
import { fetchMachinePerformance } from '@/lib/admin/machine-performance';
import { microToString, numberFrom } from '@/lib/admin/stat-math';
import type { ApiResponse, PaginatedResponse, GameListItem, GameFilters, GameCreateData } from '@/lib/types/admin';

export async function GET(request: NextRequest) {
  try {
    const profileId = await getCurrentProfileId();
    await requirePermission(PERMISSIONS.VIEW_GAMES, profileId ?? undefined);

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

    const offset = (filters.page! - 1) * filters.limit!;

    const { machines } = await fetchMachinePerformance({});

    let filtered = machines;

    if (filters.game_type && filters.game_type !== 'slots') {
      filtered = [];
    }

    if (filters.active !== undefined) {
      filtered = filtered.filter(({ config }) => config.is_active === filters.active);
    }

    const total = filtered.length;
    const paged = filtered.slice(offset, offset + filters.limit!);

    const gamesList: GameListItem[] = paged.map(({ config, allTime }) => {
      const totalWageredMicro = allTime ? numberFrom(allTime.total_amount_bet) : 0;
      const totalPayoutMicro = allTime ? numberFrom(allTime.total_amount_paid) : 0;
      const totalPlays = allTime ? numberFrom(allTime.total_bets) : 0;

      return {
        id: config.id,
        game_type: 'slots',
        name: config.display_name || config.name,
        description: config.description,
        house_edge: config.house_edge.toFixed(2),
        min_bet: microToString(config.min_bet),
        max_bet: microToString(config.max_bet),
        active: config.is_active,
        created_at: config.created_at,
        updated_at: config.updated_at,
        total_plays: totalPlays,
        total_wagered: microToString(totalWageredMicro),
        total_payout: microToString(totalPayoutMicro),
      };
    });

    const response: PaginatedResponse<GameListItem> = {
      data: gamesList,
      pagination: {
        page: filters.page!,
        limit: filters.limit!,
        total,
        total_pages: Math.ceil(total / filters.limit!),
      },
    };

    return NextResponse.json<ApiResponse<PaginatedResponse<GameListItem>>>(
      { success: true, data: response },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error in games API:', error);

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

export async function POST(request: NextRequest) {
  try {
    const profileId = await getCurrentProfileId();
    await requirePermission(PERMISSIONS.CREATE_GAMES, profileId ?? undefined);

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
  } catch (error: unknown) {
    console.error('Error creating game:', error);

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
