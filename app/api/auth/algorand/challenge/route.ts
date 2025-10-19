import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/supabaseAdmin';
import { getServerSessionFromRequest } from '@/lib/auth/session';
import {
  ALGORAND_CHALLENGE_TTL_MS,
  createAlgorandLinkChallenge,
} from '@/lib/auth/algorand-link';

export async function GET() {
  try {
    const session = await getServerSessionFromRequest();

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: baseAccount } = await supabase
      .from('accounts')
      .select('address')
      .eq('profile_id', session.sub)
      .eq('chain', 'base')
      .maybeSingle();

    let baseAddress = baseAccount?.address?.toLowerCase() ?? session.baseWalletAddress?.toLowerCase() ?? null;

    if (!baseAddress) {
      return NextResponse.json(
        { error: 'No Base account found for current session' },
        { status: 400 }
      );
    }

    if (!baseAccount && session.baseWalletAddress) {
      try {
        await supabase.from('accounts').upsert(
          {
            profile_id: session.sub,
            chain: 'base',
            address: baseAddress,
            wallet_provider: 'coinbase-embedded',
            is_primary: false,
            derived_from_chain: null,
            derived_from_address: null,
          },
          { onConflict: 'chain,address' }
        );
      } catch (error) {
        console.warn('Failed to backfill Base account during challenge:', error);
      }
    }

    const { token, payload } = createAlgorandLinkChallenge(
      session.sub,
      baseAddress
    );

    return NextResponse.json({
      challenge: token,
      expiresAt: new Date(payload.expiresAt).toISOString(),
      ttlMs: ALGORAND_CHALLENGE_TTL_MS,
      baseAddress: payload.baseAddress,
    });
  } catch (error) {
    console.error('Algorand challenge error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create Algorand challenge',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
