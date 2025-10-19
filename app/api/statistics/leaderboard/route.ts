import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { appCache } from '@/lib/cache/SimpleCache';
import { CacheKeys } from '@/lib/cache/keys';
import { CacheTTL } from '@/lib/cache/config';
import { createAdminClient } from '@/lib/db/supabaseAdmin';
import { getLeaderboard, getTournamentLeaderboard } from '@/lib/mimir/queries';
import { getLatestLeaderboardSnapshot } from '@/lib/statistics/snapshots';
import type { MimirLeaderboardEntry } from '@/lib/types/database';

const querySchema = z.object({
  machineId: z.string().uuid().optional(),
  contractId: z.coerce.number().int().nonnegative().optional(),
  rankBy: z.enum(['won', 'profit', 'rtp', 'volume']).default('profit'),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  timeframe: z.enum(['daily', 'all-time']).default('daily'),
  date: z.string().optional(), // ISO date string for daily timeframe
});

type LeaderboardEntryResponse = MimirLeaderboardEntry & {
  display_name: string | null;
  profile_id: string | null;
};

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const query = querySchema.parse({
      machineId: url.searchParams.get('machineId') ?? undefined,
      contractId: url.searchParams.get('contractId') ?? undefined,
      rankBy: url.searchParams.get('rankBy') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      timeframe: url.searchParams.get('timeframe') ?? undefined,
      date: url.searchParams.get('date') ?? undefined,
    });

    const supabase = createAdminClient();
    const scope = await resolveLeaderboardScope(
      supabase,
      query.machineId,
      query.contractId
    );

    if (scope === null) {
      return NextResponse.json(
        { ok: false, error: 'Slot machine not found' },
        { status: 404 }
      );
    }

    // For daily timeframe, use the date or default to today
    const targetDate = query.timeframe === 'daily'
      ? (query.date ? new Date(query.date) : new Date())
      : null;

    const cacheKey = CacheKeys.leaderboard(
      query.timeframe,
      query.rankBy,
      query.limit,
      scope.cacheKey,
      targetDate?.toISOString().split('T')[0]
    );

    const cached = appCache.get<LeaderboardEntryResponse[]>(cacheKey);
    if (cached) {
      return NextResponse.json({ ok: true, data: cached, source: 'cache' });
    }

    // For all-time, try to use snapshots
    if (query.timeframe === 'all-time') {
      const snapshot = await getLatestLeaderboardSnapshot(
        'leaderboard_profile',
        scope.snapshotKey
      );

      if (snapshot?.stats_data) {
        const snapshotData = snapshot.stats_data as LeaderboardEntryResponse[];
        appCache.set(cacheKey, snapshotData, CacheTTL.LEADERBOARD);
        return NextResponse.json({
          ok: true,
          data: snapshotData,
          source: 'snapshot',
        });
      }
    }

    // Fetch leaderboard data
    let leaderboard: MimirLeaderboardEntry[];

    if (query.timeframe === 'daily' && targetDate && scope.contractId) {
      // Use tournament function for daily leaderboards
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      leaderboard = await getTournamentLeaderboard({
        contractId: scope.contractId,
        startDate: startOfDay,
        endDate: endOfDay,
        limit: query.limit,
        rankBy: query.rankBy,
      });
    } else {
      // Use regular leaderboard for all-time
      leaderboard = await getLeaderboard({
        contractId: scope.contractId,
        limit: query.limit,
        rankBy: query.rankBy,
        byProfile: true,
      });
    }

    // Always enrich as profile leaderboard (shows display_name or address)
    const enriched = await enrichProfileLeaderboard(leaderboard, supabase);

    appCache.set(cacheKey, enriched, CacheTTL.LEADERBOARD);

    return NextResponse.json({ ok: true, data: enriched, source: 'mimir' });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);

    return NextResponse.json(
      { ok: false, error: 'Failed to fetch leaderboard' },
      { status: error instanceof z.ZodError ? 400 : 500 }
    );
  }
}

async function resolveLeaderboardScope(
  supabase: ReturnType<typeof createAdminClient>,
  machineId?: string,
  contractId?: number
): Promise<
  | {
      contractId?: number;
      cacheKey: string | number | undefined;
      snapshotKey: string | undefined;
    }
  | null
> {
  if (contractId !== undefined) {
    return {
      contractId,
      cacheKey: contractId,
      snapshotKey: machineId,
    };
  }

  if (!machineId) {
    return {
      contractId: undefined,
      cacheKey: undefined,
      snapshotKey: undefined,
    };
  }

  const { data, error } = await supabase
    .from('slot_machine_configs')
    .select('contract_id')
    .eq('id', machineId)
    .single();

  if (error) {
    console.error('Failed to resolve machine contract id:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    contractId: data.contract_id ?? undefined,
    cacheKey: machineId,
    snapshotKey: machineId,
  };
}

async function enrichProfileLeaderboard(
  entries: MimirLeaderboardEntry[],
  supabase: ReturnType<typeof createAdminClient>
): Promise<LeaderboardEntryResponse[]> {
  if (entries.length === 0) {
    return [];
  }

  const profileIds = entries.map((entry) => entry.identifier);

  const [
    { data: profileRows, error: profileError },
    { data: accountRows, error: accountError },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', profileIds),
    supabase
      .from('accounts')
      .select('profile_id, address')
      .in('profile_id', profileIds),
  ]);

  if (profileError) {
    console.error('Failed to fetch profile metadata:', profileError);
  }
  if (accountError) {
    console.error('Failed to fetch profile addresses:', accountError);
  }

  const profileMeta = new Map<string, string | null>();
  profileRows?.forEach((row) => {
    profileMeta.set(row.id, row.display_name);
  });

  const addressByProfile = new Map<string, Set<string>>();
  accountRows?.forEach((row) => {
    const list = addressByProfile.get(row.profile_id) ?? new Set<string>();
    list.add(row.address);
    addressByProfile.set(row.profile_id, list);
  });

  return entries.map((entry) => {
    const addresses =
      entry.linked_addresses && entry.linked_addresses.length > 0
        ? entry.linked_addresses
        : Array.from(addressByProfile.get(entry.identifier) ?? []);

    return {
      ...entry,
      linked_addresses: addresses,
      display_name: profileMeta.get(entry.identifier) ?? null,
      profile_id: entry.identifier,
    };
  });
}
