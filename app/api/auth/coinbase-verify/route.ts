import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createHash, randomUUID } from 'crypto';
import { createAdminClient } from '@/lib/db/supabaseAdmin';
import { setSessionCookie } from '@/lib/auth/cookies';
import { validateCdpToken } from '@/lib/auth/cdp-validation';
import { validateReferralCode } from '@/lib/referrals/validation';

const schema = z.object({
  accessToken: z.string().min(1, 'CDP access token is required'),
  cdpUserId: z.string().optional(),
  email: z.string().optional(),
  walletAddress: z.string().optional(),
  referralCode: z.string().min(7).max(7).optional(), // Optional - can be added later
});

/**
 * POST /api/auth/coinbase-verify
 *
 * Authenticates users via Coinbase CDP Embedded Wallets using CDP's server-side validation.
 *
 * NEW FLOW (CDP Token Validation):
 * 1. Receives CDP access token from client
 * 2. Validates token with CDP's backend to fetch the Base wallet and user identity
 * 3. Creates/updates the profile using contact data returned by CDP
 * 4. Stores the Base wallet address (authoritative source of truth)
 * 5. Issues a session tied to the CDP access token
 * 6. Returns whether an Algorand wallet has already been linked client-side
 *
 * SECURITY IMPROVEMENTS:
 * - No private keys transmitted over network
 * - Uses CDP's official token validation
 * - Backend no longer derives or observes Algorand private keys
 * - Backend never trusts client-supplied wallet data
 * - Token stored in HTTP-only cookie
 */
export async function POST(req: NextRequest) {
  const data = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const {
    accessToken,
    cdpUserId: claimedCdpUserId,
    walletAddress: claimedWalletAddress,
    referralCode,
  } = parsed.data;

  try {
    if (!accessToken) {
      return NextResponse.json(
        { error: 'CDP access token missing. Please reauthenticate.' },
        { status: 400 }
      );
    }

    // Validate the CDP access token directly with Coinbase to fetch the authoritative user record
    const cdpUser = await validateCdpToken(accessToken);

    // If token is expired or invalid, return error
    if (!cdpUser) {
      return NextResponse.json(
        { error: 'Invalid or expired CDP access token. Please reauthenticate.' },
        { status: 401 }
      );
    }

    // Warn if the client-supplied identifiers don't match what CDP reports
    if (claimedCdpUserId && claimedCdpUserId !== cdpUser.userId) {
      console.warn(
        `CDP user mismatch: client=${claimedCdpUserId} backend=${cdpUser.userId}`
      );
    }

    if (
      claimedWalletAddress &&
      claimedWalletAddress.toLowerCase() !== cdpUser.walletAddress.toLowerCase()
    ) {
      console.warn(
        `Base wallet mismatch: client=${claimedWalletAddress} backend=${cdpUser.walletAddress}`
      );
    }

    const baseWalletAddress = cdpUser.walletAddress.toLowerCase();

    const supabase = createAdminClient();

    // Get the identity from CDP - email or phone
    const normalizedEmail =
      typeof cdpUser.email === 'string' && cdpUser.email.trim().length > 0
        ? cdpUser.email.trim().toLowerCase()
        : undefined;
    const normalizedPhone =
      typeof cdpUser.phoneNumber === 'string' && cdpUser.phoneNumber.trim().length > 0
        ? cdpUser.phoneNumber.trim()
        : undefined;

    const identity = normalizedEmail ?? normalizedPhone;

    if (!identity) {
      return NextResponse.json(
        { error: 'CDP did not return email or phone number. Cannot create profile.' },
        { status: 400 }
      );
    }

    // Look up existing profile by email or phone
    const { data: profile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('id, primary_email')
      .eq('primary_email', identity)
      .maybeSingle();

    let finalProfile = profile;

    if (!profile) {
      // New profile - create it
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          primary_email: identity,
          game_access_granted: false,
          waitlist_joined_at: new Date().toISOString(),
        })
        .select('id, primary_email')
        .single();

      if (profileError || !newProfile) {
        console.error('Profile creation error:', profileError);
        return NextResponse.json(
          { error: `Failed to create profile: ${profileError?.message || 'Unknown error'}` },
          { status: 500 }
        );
      }

      finalProfile = newProfile;

      // If referral code provided, create referral relationship
      if (referralCode) {
        const referralValidation = await validateReferralCode(referralCode);
        if (
          referralValidation.valid &&
          referralValidation.referrerId &&
          referralValidation.codeId
        ) {
          const { data: canAccept } = await supabase.rpc('can_accept_referral', {
            p_profile_id: referralValidation.referrerId,
          });

          const isActive = canAccept === true;
          const now = new Date().toISOString();

          // Update the referral code to mark it as converted
          await supabase
            .from('referral_codes')
            .update({
              referred_profile_id: finalProfile.id,
              converted_at: now,
              attributed_at: now,
            })
            .eq('id', referralValidation.codeId);

          // Create the referral relationship
          await supabase.from('referrals').insert({
            referrer_profile_id: referralValidation.referrerId,
            referred_profile_id: finalProfile.id,
            referral_code_id: referralValidation.codeId,
            is_active: isActive,
            activated_at: isActive ? now : null,
          });
        }
      }
    }

    // Step 2: Store Base (EVM) account fetched from CDP
    await supabase.from('accounts').upsert(
      {
        profile_id: finalProfile.id,
        chain: 'base',
        address: baseWalletAddress,
        wallet_provider: 'coinbase-embedded',
        is_primary: false,
        derived_from_chain: null,
        derived_from_address: null,
      },
      { onConflict: 'chain,address' }
    );

    // Check whether the user has already linked an Algorand (Voi) address
    const { data: existingVoiAccount } = await supabase
      .from('accounts')
      .select('id, address')
      .eq('profile_id', finalProfile.id)
      .eq('chain', 'voi')
      .maybeSingle();

    // Step 3: Create session with CDP user ID and access token
    const sessionId = randomUUID();
    const ttlSeconds = 60 * 60 * 24 * 7; // 7 days

    const sessionToken = accessToken;

    // Store session metadata
    await supabase.from('sessions').insert({
      id: sessionId,
      profile_id: finalProfile.id,
      cdp_user_id: cdpUser.userId,
      cdp_access_token_hash: createHash('sha256').update(sessionToken).digest('hex'),
      jwt_id: null, // No longer using custom JWTs
      expires_at: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
      ip: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
          req.headers.get('x-real-ip') ?? null,
      user_agent: req.headers.get('user-agent') ?? null,
    });

    // Step 4: Set session token in cookie (this will be the CDP access token)
    await setSessionCookie(sessionToken, ttlSeconds);

    return NextResponse.json({
      ok: true,
      profileId: finalProfile.id,
      cdpUserId: cdpUser.userId,
      baseWalletAddress,
      hasLinkedAlgorand: Boolean(existingVoiAccount),
      contact: {
        email: cdpUser.email ?? null,
        phoneNumber: cdpUser.phoneNumber ?? null,
        authMethod: cdpUser.authMethod,
      },
    });
  } catch (error) {
    console.error('Coinbase CDP verify error:', error);
    return NextResponse.json(
      {
        error: 'Authentication failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
