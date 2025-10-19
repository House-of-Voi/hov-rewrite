import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { appCache } from '@/lib/cache/SimpleCache';
import { CacheKeys } from '@/lib/cache/keys';
import { CacheTTL } from '@/lib/cache/config';
import { getPlayerStatsSafe } from '@/lib/mimir/queries';
import { getCurrentProfile } from '@/lib/profile/session';
import type { MimirPlayerStats } from '@/lib/types/database';

const querySchema = z.object({
  contractId: z.coerce.number().int().nonnegative().optional(),
});

type AccountSummary = {
  address: string;
  chain: 'base' | 'voi' | 'solana';
};

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

    const accountsMap = collectUniqueAccounts(profile.accounts);

    if (accountsMap.size === 0) {
      return NextResponse.json({
        ok: true,
        data: [],
        source: 'empty',
      });
    }

    const cacheKey = CacheKeys.profileBreakdown(
      profile.profile.id,
      query.contractId
    );
    const cached = appCache.get<BreakdownEntry[]>(cacheKey);
    if (cached) {
      return NextResponse.json({ ok: true, data: cached, source: 'cache' });
    }

    const breakdown = await Promise.all(
      Array.from(accountsMap.values()).map(async (account) => {
        const stats = await getPlayerStatsSafe(
          account.address,
          query.contractId
        );

        return {
          address: account.address,
          chain: account.chain,
          stats,
        };
      })
    );

    appCache.set(cacheKey, breakdown, CacheTTL.PROFILE_BREAKDOWN);

    return NextResponse.json({ ok: true, data: breakdown, source: 'mimir' });
  } catch (error) {
    console.error('Error fetching profile breakdown:', error);

    return NextResponse.json(
      { ok: false, error: 'Failed to fetch address breakdown' },
      { status: error instanceof z.ZodError ? 400 : 500 }
    );
  }
}

function collectUniqueAccounts(
  accounts: Array<{ address: string; chain: 'base' | 'voi' | 'solana' | null }>
): Map<string, AccountSummary> {
  const map = new Map<string, AccountSummary>();

  for (const account of accounts) {
    if (!account.address) {
      continue;
    }

    const key = account.address.trim().toLowerCase();

    if (!map.has(key) && account.chain) {
      map.set(key, {
        address: account.address.trim(),
        chain: account.chain,
      });
    }
  }

  return map;
}
type BreakdownEntry = {
  address: string;
  chain: 'base' | 'voi' | 'solana';
  stats: MimirPlayerStats | null;
};
