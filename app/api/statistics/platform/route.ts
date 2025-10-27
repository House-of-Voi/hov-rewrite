import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { PostgrestError } from '@supabase/supabase-js';

import { appCache } from '@/lib/cache/SimpleCache';
import { CacheKeys } from '@/lib/cache/keys';
import { CacheTTL } from '@/lib/cache/config';
import { createAdminClient } from '@/lib/db/supabaseAdmin';
import { getPlatformStats, getPlatformStatsByDate } from '@/lib/mimir/queries';
import { mimirClient } from '@/lib/mimir/client';

const querySchema = z.object({
  contractId: z.coerce.number().int().nonnegative(),
  timeframe: z.enum(['daily', 'all-time']).default('all-time'),
  date: z.string().optional(), // ISO date string for daily timeframe
});

type PlatformStatPayload = Awaited<ReturnType<typeof getPlatformStats>> extends Array<
  infer Item
>
  ? Item
  : never;

interface PlatformStatResponse extends PlatformStatPayload {
  machine_name: string | null;
  slot_machine_config_id: string | null;
  chain: 'base' | 'voi' | 'solana' | null;
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const query = querySchema.parse({
      contractId: url.searchParams.get('contractId'),
      timeframe: url.searchParams.get('timeframe') ?? undefined,
      date: url.searchParams.get('date') ?? undefined,
    });

    const targetDate = query.timeframe === 'daily'
      ? (query.date ? new Date(query.date) : new Date())
      : null;

    const cacheKey = CacheKeys.platformStats(
      query.contractId,
      query.timeframe,
      targetDate?.toISOString().split('T')[0]
    );

    const cached = appCache.get<PlatformStatResponse[]>(cacheKey);
    if (cached) {
      return NextResponse.json({ ok: true, data: cached, source: 'cache' });
    }

    let mimirStats: Awaited<ReturnType<typeof getPlatformStats>>;

    if (query.timeframe === 'daily' && targetDate) {
      // For daily stats, get the last 24 hours of data instead of a specific date
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const roundRange = await getRoundRangeForDateRange(
        last24Hours,
        now
      );

      if (roundRange.startRound && roundRange.endRound) {
        // Call the date-specific stats function
        const dailyStats = await getPlatformStatsByDate(
          query.contractId,
          roundRange.startRound,
          roundRange.endRound
        );
        mimirStats = [dailyStats];
      } else {
        // No data for this date range
        mimirStats = [];
      }
    } else {
      // All-time stats
      mimirStats = await getPlatformStats(query.contractId);
    }

    const configMap = await loadMachineConfigMap(query.contractId);

    const enriched = mimirStats.map((stat) => {
      const config = configMap.get(query.contractId);

      return {
        ...stat,
        machine_name: config?.display_name ?? null,
        slot_machine_config_id: config?.id ?? null,
        chain: (config?.chain as PlatformStatResponse['chain']) ?? null,
      };
    });


    appCache.set(cacheKey, enriched, CacheTTL.PLATFORM_STATS);

    return NextResponse.json({ ok: true, data: enriched, source: 'mimir' });
  } catch (error) {
    console.error('Error fetching platform stats:', error);

    return NextResponse.json(
      { ok: false, error: 'Failed to fetch platform statistics' },
      { status: error instanceof z.ZodError ? 400 : 500 }
    );
  }
}

async function getRoundRangeForDateRange(
  startDate: Date,
  endDate: Date
): Promise<{ startRound?: number; endRound?: number }> {
  try {
    // Query block_header from Mimir database to find min and max rounds within the date range
    const { data, error } = await mimirClient
      .from('block_header')
      .select('round')
      .gte('realtime', startDate.toISOString())
      .lte('realtime', endDate.toISOString())
      .order('round', { ascending: true });

    if (error) {
      console.error('Failed to query block_header for round range:', error);
      return {};
    }

    if (!data || data.length === 0) {
      console.warn('No blocks found in date range:', { startDate, endDate });
      return {};
    }

    const rounds = data.map((row) => row.round);
    return {
      startRound: Math.min(...rounds),
      endRound: Math.max(...rounds),
    };
  } catch (error) {
    console.error('Error getting round range:', error);
    return {};
  }
}

type MachineConfigRow = {
  id: string;
  display_name: string | null;
  contract_id: number;
  chain: 'base' | 'voi' | 'solana' | null;
};

async function loadMachineConfigMap(contractId?: number) {
  const supabase = createAdminClient();

  const query = supabase
    .from('slot_machine_configs')
    .select('id, display_name, contract_id, chain');

  if (contractId !== undefined) {
    query.eq('contract_id', contractId);
  }

  const { data, error } = await query;

  if (error || !data) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? String((error as PostgrestError).code)
        : undefined;

    if (code === 'PGRST205') {
      console.warn(
        'slot_machine_configs table not found. Skipping machine enrichment.'
      );
    } else {
      console.error('Failed to load slot machine configs:', error);
    }

    return new Map<number, MachineConfigRow>();
  }

  return new Map<number, MachineConfigRow>(
    data.map((config) => [config.contract_id as number, config as MachineConfigRow])
  );
}
