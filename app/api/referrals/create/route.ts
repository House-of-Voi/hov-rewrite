import { NextResponse } from 'next/server';
import { getServerSessionFromRequest } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/db/supabaseAdmin';
import { generateReferralCode } from '@/lib/utils/referral';

/**
 * POST /api/referrals/create
 * Creates a new one-time-use referral code for the authenticated user
 */
export async function POST() {
  const session = await getServerSessionFromRequest();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Check if user can create more codes
  const { data: canCreate, error: checkError } = await supabase.rpc(
    'can_create_code',
    {
      p_profile_id: session.sub,
    }
  );

  if (checkError) {
    console.error('Error checking code creation capacity:', checkError);
    return NextResponse.json(
      { error: 'Failed to check referral capacity' },
      { status: 500 }
    );
  }

  if (!canCreate) {
    // Get current count and max for better error message
    const { data: profile } = await supabase
      .from('profiles')
      .select('max_referrals')
      .eq('id', session.sub)
      .single();

    const { data: currentCount } = await supabase.rpc('count_generated_codes', {
      p_profile_id: session.sub,
    });

    return NextResponse.json(
      {
        error: 'Referral code limit reached',
        current: currentCount || 0,
        max: profile?.max_referrals || 5,
      },
      { status: 403 }
    );
  }

  // Generate a unique code
  let code: string;
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    code = generateReferralCode();

    // Try to insert the code
    const { data, error } = await supabase
      .from('referral_codes')
      .insert({
        referrer_profile_id: session.sub,
        code: code.toUpperCase(),
      })
      .select()
      .single();

    if (!error) {
      // Success! Return the created code
      return NextResponse.json({
        ok: true,
        code: data.code,
        id: data.id,
        created_at: data.created_at,
      });
    }

    // If it's a unique constraint error, try again with a new code
    if (error.code === '23505') {
      attempts++;
      continue;
    }

    // Otherwise, it's a different error
    console.error('Error creating referral code:', error);
    return NextResponse.json(
      { error: 'Failed to create referral code' },
      { status: 500 }
    );
  }

  // Failed to generate unique code after max attempts
  return NextResponse.json(
    { error: 'Failed to generate unique code after maximum attempts' },
    { status: 500 }
  );
}
