import { NextResponse } from 'next/server';
import { getServerSessionFromRequest } from '@/lib/auth/session';
import { getReferralStats } from '@/lib/referrals/validation';

/**
 * GET /api/referrals/info
 * Returns the authenticated user's referral information and stats
 */
export async function GET() {
  const session = await getServerSessionFromRequest();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stats = await getReferralStats(session.sub);

  if (!stats) {
    return NextResponse.json(
      { error: 'Referral information not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    ...stats,
  });
}
