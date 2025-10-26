import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createHash } from 'crypto';
import { createAdminClient } from '@/lib/db/supabaseAdmin';
import { validateCdpToken } from '@/lib/auth/cdp-validation';
import { SESSION_COOKIE, setSessionCookie } from '@/lib/auth/cookies';

/**
 * POST /api/auth/refresh
 *
 * Refreshes the current session by re-validating the CDP token.
 * This endpoint is called when:
 * - Client detects potential session issues
 * - User explicitly requests to refresh their session
 * - Periodic session health checks
 *
 * The endpoint will:
 * 1. Validate the current CDP token with Coinbase
 * 2. Update the session expiration if valid
 * 3. Return session status
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) {
      return NextResponse.json(
        { ok: false, error: 'No session token found' },
        { status: 401 }
      );
    }

    // Validate the CDP token with retry logic and timeout
    const cdpUser = await validateCdpToken(token, {
      timeout: 8000, // 8 second timeout
      retries: 2, // Retry twice on failure
    });

    if (!cdpUser) {
      return NextResponse.json(
        { ok: false, error: 'Invalid or expired CDP token' },
        { status: 401 }
      );
    }

    // Hash the token to find the session
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const supabase = createAdminClient();

    // Look up the session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, profile_id, cdp_user_id')
      .eq('cdp_access_token_hash', tokenHash)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { ok: false, error: 'Session not found in database' },
        { status: 401 }
      );
    }

    // Verify CDP user ID matches
    if (session.cdp_user_id !== cdpUser.userId) {
      console.error('CDP user ID mismatch during refresh');
      return NextResponse.json(
        { ok: false, error: 'Session user mismatch' },
        { status: 401 }
      );
    }

    // Extend the session expiration
    const ttlSeconds = 60 * 60 * 24 * 7; // 7 days
    const newExpiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

    await supabase
      .from('sessions')
      .update({ expires_at: newExpiresAt })
      .eq('id', session.id);

    // Refresh the cookie with extended TTL
    await setSessionCookie(token, ttlSeconds);

    return NextResponse.json({
      ok: true,
      message: 'Session refreshed successfully',
      expiresAt: newExpiresAt,
      profileId: session.profile_id,
    });
  } catch (error) {
    console.error('Session refresh error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to refresh session',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
