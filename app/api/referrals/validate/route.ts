import { NextRequest, NextResponse } from 'next/server';
import { validateReferralCode } from '@/lib/referrals/validation';

/**
 * POST /api/referrals/validate
 * Validates a referral code and returns information about its status
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { code } = body;

  if (!code || typeof code !== 'string') {
    return NextResponse.json(
      { error: 'Referral code is required' },
      { status: 400 }
    );
  }

  const result = await validateReferralCode(code.toUpperCase());

  return NextResponse.json({
    ok: result.valid,
    ...result,
  });
}
