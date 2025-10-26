import { NextRequest, NextResponse } from 'next/server';
import { getServerSessionFromRequest } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/db/supabaseAdmin';

/**
 * POST /api/referrals/deactivate
 * Deactivates a referral code (can only deactivate your own unused codes)
 */
export async function POST(req: NextRequest) {
  const session = await getServerSessionFromRequest();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { codeId } = body;

  if (!codeId || typeof codeId !== 'string') {
    return NextResponse.json(
      { error: 'Code ID is required' },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Get the code and verify ownership
  const { data: code, error: fetchError } = await supabase
    .from('referral_codes')
    .select('id, referrer_profile_id, referred_profile_id, deactivated_at')
    .eq('id', codeId)
    .single();

  if (fetchError || !code) {
    return NextResponse.json(
      { error: 'Referral code not found' },
      { status: 404 }
    );
  }

  // Check ownership
  if (code.referrer_profile_id !== session.sub) {
    return NextResponse.json(
      { error: 'You can only deactivate your own codes' },
      { status: 403 }
    );
  }

  // Check if already deactivated
  if (code.deactivated_at) {
    return NextResponse.json(
      { error: 'Code is already deactivated' },
      { status: 400 }
    );
  }

  // Check if code has been used
  if (code.referred_profile_id) {
    return NextResponse.json(
      { error: 'Cannot deactivate a code that has been used' },
      { status: 400 }
    );
  }

  // Deactivate the code
  const { error: updateError } = await supabase
    .from('referral_codes')
    .update({
      deactivated_at: new Date().toISOString(),
    })
    .eq('id', codeId);

  if (updateError) {
    console.error('Error deactivating code:', updateError);
    return NextResponse.json(
      { error: 'Failed to deactivate code' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: 'Code deactivated successfully',
  });
}
