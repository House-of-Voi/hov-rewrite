import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabaseAdmin';
import { getServerSessionFromRequest } from '@/lib/auth/session';
import { validateReferralCode } from '@/lib/referrals/validation';

const schema = z.object({
  referralCode: z.string().length(7),
});

/**
 * POST /api/profile/link-referral
 *
 * Links a referral code to the authenticated user's profile.
 * Used during onboarding when a user provides a referral code.
 *
 * Request body:
 * {
 *   referralCode: string (7 characters)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Get authenticated session
    const session = await getServerSessionFromRequest();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: parsed.error.errors,
        },
        { status: 400 }
      );
    }

    const { referralCode } = parsed.data;
    const supabase = createAdminClient();

    // Check if user already has a referral relationship
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('id')
      .eq('referred_profile_id', session.profileId)
      .single();

    if (existingReferral) {
      return NextResponse.json(
        { error: 'You already have a referrer linked to your account' },
        { status: 400 }
      );
    }

    // Validate the referral code
    const referralValidation = await validateReferralCode(referralCode);

    if (!referralValidation.valid) {
      return NextResponse.json(
        { error: referralValidation.error || 'Invalid referral code' },
        { status: 400 }
      );
    }

    if (!referralValidation.referrerId || !referralValidation.codeId) {
      return NextResponse.json(
        { error: 'Referral code validation failed' },
        { status: 400 }
      );
    }

    // Check if user is trying to refer themselves
    if (referralValidation.referrerId === session.profileId) {
      return NextResponse.json(
        { error: 'You cannot use your own referral code' },
        { status: 400 }
      );
    }

    // Check if referrer can accept active referrals
    const { data: canAccept } = await supabase.rpc('can_accept_referral', {
      p_profile_id: referralValidation.referrerId,
    });

    const isActive = canAccept === true;
    const now = new Date().toISOString();

    // Get the current code to check if attributed_at is already set
    const { data: currentCode } = await supabase
      .from('referral_codes')
      .select('attributed_at')
      .eq('id', referralValidation.codeId)
      .single();

    // Update the referral code to mark it as converted
    await supabase
      .from('referral_codes')
      .update({
        referred_profile_id: session.profileId,
        converted_at: now,
        // Set attributed_at if not already set (from landing page visit)
        attributed_at: currentCode?.attributed_at || now,
      })
      .eq('id', referralValidation.codeId);

    // Create the referral relationship
    const { error: referralError } = await supabase
      .from('referrals')
      .insert({
        referrer_profile_id: referralValidation.referrerId,
        referred_profile_id: session.profileId,
        referral_code_id: referralValidation.codeId,
        is_active: isActive,
        activated_at: isActive ? now : null,
      });

    if (referralError) {
      console.error('Referral creation error:', referralError);
      return NextResponse.json(
        { error: 'Failed to create referral relationship' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        referrerId: referralValidation.referrerId,
        isActive,
        message: isActive
          ? 'Referral code linked successfully!'
          : 'Referral code linked! You are in the queue.',
      },
    });
  } catch (error) {
    console.error('Link referral error:', error);
    return NextResponse.json(
      {
        error: 'Failed to link referral code',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
