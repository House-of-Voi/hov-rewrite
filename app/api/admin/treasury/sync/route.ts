/**
 * Treasury Sync API
 * Fetches on-chain treasury balances from Voi contracts and updates local database
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/supabaseAdmin';
import { requirePermission, getCurrentProfileId, PERMISSIONS } from '@/lib/auth/admin';
import { getContractBalances } from '@/lib/voi/contract-client';
import { env } from '@/lib/utils/env';
import type { ApiResponse, TreasuryItem } from '@/lib/types/admin';

interface SyncResult {
  updated: number;
  treasuries: TreasuryItem[];
  timestamp: string;
  errors?: string[];
}

export async function POST() {
  try {
    const profileId = await getCurrentProfileId();
    await requirePermission(PERMISSIONS.MANAGE_GAMES, profileId);

    // Check if Voi configuration is available
    if (!env.VOI_NODE_URL) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Voi network not configured. Set VOI_NODE_URL in environment.'
        },
        { status: 503 }
      );
    }

    const supabase = createAdminClient();

    // Fetch all Voi slot machine configs (source of truth for all machines)
    const { data: slotMachines, error: fetchError } = await supabase
      .from('slot_machine_configs')
      .select('contract_id, chain, display_name')
      .eq('chain', 'voi')
      .eq('is_active', true);

    if (fetchError) {
      console.error('Failed to fetch slot machines from database:', fetchError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to fetch slot machines from database' },
        { status: 500 }
      );
    }

    if (!slotMachines || slotMachines.length === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'No active Voi slot machines found in database. Add machines to slot_machine_configs table first.'
        },
        { status: 404 }
      );
    }

    // Sync each slot machine contract
    let updatedCount = 0;
    const errors: string[] = [];

    for (const machine of slotMachines) {
      try {
        const appId = Number(machine.contract_id);

        if (isNaN(appId) || appId <= 0) {
          errors.push(`Invalid contract_id for ${machine.display_name}: ${machine.contract_id}`);
          continue;
        }

        // Fetch on-chain balances for this contract
        const balances = await getContractBalances({ appId });

        // Update/insert treasury record
        const treasuryData = {
          contract_id: machine.contract_id.toString(),
          chain: machine.chain,
          game_type: 'slots' as const,
          game_name: machine.display_name,
          balance: balances.balanceTotal.toString(),
          reserved: balances.balanceLocked.toString(),
          updated_at: new Date().toISOString(),
        };

        const { error: upsertError } = await supabase
          .from('treasury_balances')
          .upsert(treasuryData, {
            onConflict: 'contract_id',
            ignoreDuplicates: false
          });

        if (upsertError) {
          errors.push(`Failed to update ${machine.display_name}: ${upsertError.message}`);
        } else {
          updatedCount++;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to sync ${machine.display_name}: ${errorMsg}`);
        console.error(`Error syncing contract ${machine.contract_id}:`, error);
      }
    }

    // Fetch all treasury balances to return
    const { data: allTreasuries } = await supabase
      .from('treasury_balances')
      .select('*')
      .order('game_name', { ascending: true });

    // Format treasury items with calculated available balance
    const treasuries: TreasuryItem[] = (allTreasuries || []).map(t => ({
      contract_id: t.contract_id,
      chain: t.chain,
      game_type: t.game_type,
      game_name: t.game_name,
      balance: t.balance,
      reserved: t.reserved,
      available: (parseFloat(t.balance || '0') - parseFloat(t.reserved || '0')).toString(),
      updated_at: t.updated_at,
    }));

    const result: SyncResult = {
      updated: updatedCount,
      treasuries,
      timestamp: new Date().toISOString(),
      ...(errors.length > 0 && { errors }),
    };

    return NextResponse.json<ApiResponse<SyncResult>>(
      {
        success: updatedCount > 0,
        data: result,
        ...(errors.length > 0 && { error: `${updatedCount} updated, ${errors.length} failed` })
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error syncing treasury:', error);

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
