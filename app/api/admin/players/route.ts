/**
 * Admin Players API
 * List and search all players with pagination and filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/supabaseAdmin';
import { requirePermission, getCurrentProfileId, PERMISSIONS } from '@/lib/auth/admin';
import type { ApiResponse, PaginatedResponse, PlayerListItem, PlayerFilters } from '@/lib/types/admin';

type SupabaseAccount = {
  chain?: string | null;
  address?: string | null;
  is_primary?: boolean | null;
};

const normalizeAccounts = (accounts: unknown): PlayerListItem['accounts'] => {
  if (!Array.isArray(accounts)) {
    return [];
  }

  return accounts.reduce<PlayerListItem['accounts']>((acc, account) => {
    if (!account || typeof account !== 'object') {
      return acc;
    }

    const { chain, address, is_primary } = account as SupabaseAccount;

    if (typeof chain !== 'string' || typeof address !== 'string') {
      return acc;
    }

    acc.push({
      chain,
      address,
      is_primary: is_primary === true,
    });

    return acc;
  }, []);
};

export async function GET(request: NextRequest) {
  try {
    const profileId = await getCurrentProfileId();
    await requirePermission(PERMISSIONS.VIEW_PLAYERS, profileId ?? undefined);

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const filters: PlayerFilters = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '50'), 100),
      search: searchParams.get('search') || undefined,
      game_access: searchParams.get('game_access') === 'true' ? true :
                    searchParams.get('game_access') === 'false' ? false : undefined,
      on_waitlist: searchParams.get('on_waitlist') === 'true' ? true :
                   searchParams.get('on_waitlist') === 'false' ? false : undefined,
      chain: (searchParams.get('chain') as 'base' | 'voi' | 'solana') || undefined,
      created_after: searchParams.get('created_after') || undefined,
      created_before: searchParams.get('created_before') || undefined,
      sort_by: searchParams.get('sort_by') || 'created_at',
      sort_order: (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc',
    };

    const supabase = createAdminClient();
    const offset = (filters.page! - 1) * filters.limit!;

    // Build query for profiles with accounts
    let query = supabase
      .from('profiles')
      .select(`
        id,
        primary_email,
        display_name,
        avatar_url,
        game_access_granted,
        waitlist_position,
        waitlist_joined_at,
        created_at,
        accounts (
          chain,
          address,
          is_primary
        )
      `, { count: 'exact' });

    // Apply filters
    if (filters.search) {
      query = query.or(`primary_email.ilike.%${filters.search}%,display_name.ilike.%${filters.search}%`);
    }

    if (filters.game_access !== undefined) {
      query = query.eq('game_access_granted', filters.game_access);
    }

    if (filters.on_waitlist !== undefined) {
      if (filters.on_waitlist) {
        query = query.not('waitlist_position', 'is', null);
      } else {
        query = query.is('waitlist_position', null);
      }
    }

    if (filters.created_after) {
      query = query.gte('created_at', filters.created_after);
    }

    if (filters.created_before) {
      query = query.lte('created_at', filters.created_before);
    }

    // Apply sorting
    query = query.order(filters.sort_by!, { ascending: filters.sort_order === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + filters.limit! - 1);

    const { data: profiles, error, count } = await query;

    if (error) {
      console.error('Error fetching players:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to fetch players' },
        { status: 500 }
      );
    }

    // Filter by chain if specified
    let playersData = profiles || [];
    if (filters.chain) {
      playersData = playersData.filter(p =>
        p.accounts?.some((a: { chain: string }) => a.chain === filters.chain)
      );
    }

    // Get game play stats for each player
    const playerIds = playersData.map(p => p.id);
    const { data: playStats } = await supabase
      .from('game_plays')
      .select('profile_id, bet_amount, created_at')
      .in('profile_id', playerIds);

    // Aggregate stats by player
    const statsMap = new Map<string, { total_plays: number; total_wagered: number; last_play_at: string | null }>();
    playStats?.forEach(play => {
      const current = statsMap.get(play.profile_id) || { total_plays: 0, total_wagered: 0, last_play_at: null };
      current.total_plays++;
      current.total_wagered += parseFloat(play.bet_amount || '0');
      if (!current.last_play_at || play.created_at > current.last_play_at) {
        current.last_play_at = play.created_at;
      }
      statsMap.set(play.profile_id, current);
    });

    // Format response
    const players: PlayerListItem[] = playersData.map(profile => {
      const stats = statsMap.get(profile.id);
      const totalWagered = stats?.total_wagered ?? 0;
      const lastPlayAt = stats?.last_play_at ?? undefined;

      return {
        id: profile.id,
        primary_email: profile.primary_email,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        game_access_granted: profile.game_access_granted,
        waitlist_position: profile.waitlist_position,
        waitlist_joined_at: profile.waitlist_joined_at,
        created_at: profile.created_at,
        total_plays: stats?.total_plays || 0,
        total_wagered: totalWagered.toFixed(8),
        ...(lastPlayAt ? { last_play_at: lastPlayAt } : {}),
        accounts: normalizeAccounts(profile.accounts),
      };
    });

    const response: PaginatedResponse<PlayerListItem> = {
      data: players,
      pagination: {
        page: filters.page!,
        limit: filters.limit!,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / filters.limit!),
      },
    };

    return NextResponse.json<ApiResponse<PaginatedResponse<PlayerListItem>>>(
      { success: true, data: response },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error in players API:', error);

    if (error instanceof Error && (error.message?.includes('UNAUTHORIZED') || error.message?.includes('FORBIDDEN'))) {
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
