import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { appCache } from '@/lib/cache/SimpleCache';
import { CacheKeys } from '@/lib/cache/keys';
import { CacheTTL } from '@/lib/cache/config';
import { getPlayerStats } from '@/lib/mimir/queries';
import type { MimirPlayerStats } from '@/lib/types/database';

const paramsSchema = z.object({
  address: z.string().min(1),
});

const querySchema = z.object({
  contractId: z.coerce.number().int().nonnegative().optional(),
});

type RouteContext = {
  params: Promise<{ address: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params;
    const { address } = paramsSchema.parse(params);

    const url = new URL(request.url);
    const { contractId } = querySchema.parse({
      contractId: url.searchParams.get('contractId') ?? undefined,
    });

    const cacheKey = CacheKeys.playerStats(address, contractId);
    const cached = appCache.get<MimirPlayerStats>(cacheKey);
    if (cached) {
      return NextResponse.json({ ok: true, data: cached, source: 'cache' });
    }

    const stats = await getPlayerStats(address, contractId);

    appCache.set(cacheKey, stats, CacheTTL.PLAYER_STATS);

    return NextResponse.json({ ok: true, data: stats, source: 'mimir' });
  } catch (error) {
    console.error('Error fetching player stats:', error);

    return NextResponse.json(
      { ok: false, error: 'Failed to fetch player statistics' },
      { status: error instanceof z.ZodError ? 400 : 500 }
    );
  }
}
