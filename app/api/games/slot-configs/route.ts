/**
 * Public Slot Machine Configs API
 * List active slot machine configurations for players
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/supabaseAdmin';
import type { ApiResponse, SlotMachineConfig } from '@/lib/types/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get('chain') as 'base' | 'voi' | 'solana' | null;

    const supabase = createAdminClient();

    // Build query - only return active configs
    let query = supabase
      .from('slot_machine_configs')
      .select('*')
      .eq('is_active', true)
      .order('launched_at', { ascending: false });

    // Filter by chain if specified
    if (chain) {
      query = query.eq('chain', chain);
    }

    const { data: configs, error } = await query;

    if (error) {
      console.error('Error fetching slot machine configs:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to fetch games' },
        { status: 500 }
      );
    }

    // Format response - only include necessary fields for public consumption
    const publicConfigs = (configs || []).map(config => ({
      id: config.id,
      name: config.name,
      display_name: config.display_name,
      description: config.description,
      theme: config.theme,
      contract_id: config.contract_id,
      chain: config.chain,
      rtp_target: config.rtp_target,
      house_edge: config.house_edge,
      min_bet: config.min_bet,
      max_bet: config.max_bet,
      max_paylines: config.max_paylines,
      launched_at: config.launched_at,
    }));

    return NextResponse.json<ApiResponse<typeof publicConfigs>>(
      { success: true, data: publicConfigs },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in public slot configs API:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

