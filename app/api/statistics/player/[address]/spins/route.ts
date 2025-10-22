import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { appCache } from '@/lib/cache/SimpleCache';
import { CacheKeys } from '@/lib/cache/keys';
import { CacheTTL } from '@/lib/cache/config';
import { getPlayerSpins } from '@/lib/mimir/queries';
import type { MimirSpinEvent } from '@/lib/types/database';

const paramsSchema = z.object({
  address: z.string().min(1),
});

const querySchema = z.object({
  contractId: z.coerce.number().int().nonnegative().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  order: z.enum(['asc', 'desc']).default('desc'),
});

type PlayerSpinsPayload = {
  spins: MimirSpinEvent[];
  limit: number;
  offset: number;
  total: number;
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ address: string }> }
) {
  try {
    const routeParams = await context.params;
    const { address } = paramsSchema.parse(routeParams);

    const url = new URL(request.url);
    const query = querySchema.parse({
      contractId: url.searchParams.get('contractId') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      offset: url.searchParams.get('offset') ?? undefined,
      order: url.searchParams.get('order') ?? undefined,
    });

    if (query.order === 'asc') {
      return NextResponse.json(
        { ok: false, error: 'Ascending order is not supported yet.' },
        { status: 400 }
      );
    }

    const cacheKey = CacheKeys.playerSpins(
      address,
      query.limit,
      query.offset,
      query.order,
      query.contractId
    );
    const cached = appCache.get<PlayerSpinsPayload>(cacheKey);
    if (cached) {
      return NextResponse.json({ ok: true, data: cached, source: 'cache' });
    }

    const spins = await getPlayerSpins(
      address,
      query.contractId,
      query.limit,
      query.offset
    );

    const payload = {
      spins,
      limit: query.limit,
      offset: query.offset,
      total: query.offset + spins.length,
    } satisfies PlayerSpinsPayload;

    appCache.set(cacheKey, payload, CacheTTL.PLAYER_SPINS);

    return NextResponse.json({ ok: true, data: payload, source: 'mimir' });
  } catch (error) {
    console.error('Error fetching spin history:', error);

    return NextResponse.json(
      { ok: false, error: 'Failed to fetch spin history' },
      { status: error instanceof z.ZodError ? 400 : 500 }
    );
  }
}
