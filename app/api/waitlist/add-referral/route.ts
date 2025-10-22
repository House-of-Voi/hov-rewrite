import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSessionFromRequest } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/db/supabaseAdmin';
import { validateReferralCode } from '@/lib/referrals/validation';

const schema = z.object({
  referralCode: z.string().min(7).max(7),
});

export async function POST(req: NextRequest) {
  // Get authenticated session
  const session = await getServerSessionFromRequest();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid referral code format' }, { status: 400 });
  }

  const { referralCode } = parsed.data;
  const supabase = createAdminClient();

  // Check if user already has a referral
  const { data: existingReferral } = await supabase
    .from('referrals')
    .select('id')
    .eq('referred_profile_id', session.profileId)
    .single();

  if (existingReferral) {
    return NextResponse.json(
      { error: 'You already have a referral code associated with your account' },
      { status: 400 }
    );
  }

  // Validate the referral code
  const validation = await validateReferralCode(referralCode);

  if (!validation.valid || !validation.referrerId) {
    return NextResponse.json(
      { error: validation.error || 'Invalid referral code' },
      { status: 400 }
    );
  }

  // Check if trying to refer themselves
  if (validation.referrerId === session.profileId) {
    return NextResponse.json(
      { error: 'You cannot use your own referral code' },
      { status: 400 }
    );
  }

  // Check if referrer can accept referrals
  const { data: canAccept } = await supabase.rpc('can_accept_referral', {
    p_profile_id: validation.referrerId,
  });

  const isActive = canAccept === true;

  // Create the referral relationship
  const { error: insertError } = await supabase.from('referrals').insert({
    referrer_profile_id: validation.referrerId,
    referred_profile_id: session.profileId,
    is_active: isActive,
    activated_at: isActive ? new Date().toISOString() : null,
  });

  if (insertError) {
    console.error('Failed to create referral:', insertError);
    return NextResponse.json(
      { error: 'Failed to add referral code' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    isActive,
    message: isActive
      ? 'Referral code added and activated!'
      : 'Referral code added. You are on the waitlist for this referrer.',
  });
}
