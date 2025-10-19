import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { appCache } from '@/lib/cache/SimpleCache';
import { CacheKeys } from '@/lib/cache/keys';
import { CacheTTL } from '@/lib/cache/config';
import {
  AggregatedProfileStatsPayload,
  getAggregatedProfileStatsSafe,
  serializeAggregatedProfileStats,
} from '@/lib/mimir/aggregation';
import { getCurrentProfile } from '@/lib/profile/session';

const querySchema = z.object({
  contractId: z.coerce.number().int().nonnegative().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const profile = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json(
        { ok: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const query = querySchema.parse({
      contractId: url.searchParams.get('contractId') ?? undefined,
    });

    const addresses = [
      ...new Set(
        profile.accounts
          .map((account) => account.address?.trim().toLowerCase())
          .filter((address): address is string => Boolean(address))
      ),
    ];

    if (addresses.length === 0) {
      return NextResponse.json({
        ok: true,
        data: {
          addresses: [],
          total_spins: 0,
          winning_spins: 0,
          losing_spins: 0,
          total_bet: '0',
          total_won: '0',
          net_result: '0',
          rtp: 0,
          win_rate: 0,
          largest_win: '0',
        },
        source: 'empty',
      });
    }

    const cacheKey = CacheKeys.aggregatedProfile(
      profile.profile.id,
      query.contractId
    );
    const cached = appCache.get<AggregatedProfileStatsPayload>(cacheKey);
    if (cached) {
      return NextResponse.json({ ok: true, data: cached, source: 'cache' });
    }

    const stats = await getAggregatedProfileStatsSafe(
      addresses,
      query.contractId
    );

    if (!stats) {
      return NextResponse.json(
        { ok: false, error: 'Failed to aggregate profile statistics' },
        { status: 502 }
      );
    }

    const payload = serializeAggregatedProfileStats(stats);

    appCache.set(cacheKey, payload, CacheTTL.PROFILE_AGGREGATE);

    return NextResponse.json({ ok: true, data: payload, source: 'mimir' });
  } catch (error) {
    console.error('Error fetching profile statistics:', error);

    return NextResponse.json(
      { ok: false, error: 'Failed to fetch profile statistics' },
      { status: error instanceof z.ZodError ? 400 : 500 }
    );
  }
}
