/**
 * Admin Slot Machine Configs API
 * List all slot machine configurations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/supabaseAdmin';
import { requirePermission, getCurrentProfileId, PERMISSIONS } from '@/lib/auth/admin';
import type { ApiResponse, PaginatedResponse, SlotMachineConfigListItem, SlotMachineConfigFilters } from '@/lib/types/admin';

export async function GET(request: NextRequest) {
  try {
    const profileId = await getCurrentProfileId();
    await requirePermission(PERMISSIONS.VIEW_GAMES, profileId ?? undefined);

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const filters: SlotMachineConfigFilters = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '50'), 100),
      chain: (searchParams.get('chain') as 'base' | 'voi' | 'solana') || undefined,
      is_active: searchParams.get('is_active') === 'true' ? true :
                 searchParams.get('is_active') === 'false' ? false : undefined,
      theme: searchParams.get('theme') || undefined,
      sort_by: searchParams.get('sort_by') || 'created_at',
      sort_order: (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc',
    };

    const supabase = createAdminClient();
    const offset = (filters.page! - 1) * filters.limit!;

    // Build query
    let query = supabase
      .from('slot_machine_configs')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters.chain) {
      query = query.eq('chain', filters.chain);
    }

    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters.theme) {
      query = query.eq('theme', filters.theme);
    }

    // Apply sorting
    query = query.order(filters.sort_by!, { ascending: filters.sort_order === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + filters.limit! - 1);

    const { data: configs, error, count } = await query;

    if (error) {
      console.error('Error fetching slot machine configs:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to fetch slot machine configurations' },
        { status: 500 }
      );
    }

    // Get play stats for each config from Mimir data
    // For now, we'll return the configs without stats since we need to integrate with Mimir
    // TODO: Integrate with Mimir to get actual play statistics

    // Format response
    const configsList: SlotMachineConfigListItem[] = (configs || []).map(config => ({
      id: config.id,
      name: config.name,
      display_name: config.display_name,
      description: config.description,
      theme: config.theme,
      contract_id: config.contract_id,
      chain: config.chain,
      treasury_address: config.treasury_address,
      rtp_target: config.rtp_target,
      house_edge: config.house_edge,
      min_bet: config.min_bet,
      max_bet: config.max_bet,
      max_paylines: config.max_paylines,
      reel_config: config.reel_config,
      is_active: config.is_active,
      launched_at: config.launched_at,
      deprecated_at: config.deprecated_at,
      version: config.version,
      created_at: config.created_at,
      updated_at: config.updated_at,
      total_spins: 0, // TODO: Get from Mimir
      total_wagered: '0.00000000', // TODO: Get from Mimir
      total_payout: '0.00000000', // TODO: Get from Mimir
      unique_players: 0, // TODO: Get from Mimir
    }));

    const response: PaginatedResponse<SlotMachineConfigListItem> = {
      data: configsList,
      pagination: {
        page: filters.page!,
        limit: filters.limit!,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / filters.limit!),
      },
    };

    return NextResponse.json<ApiResponse<PaginatedResponse<SlotMachineConfigListItem>>>(
      { success: true, data: response },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error in slot configs API:', error);

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

