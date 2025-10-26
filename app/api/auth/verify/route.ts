import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/supabaseAdmin';
import { verifySignature } from '@/lib/chains/verify';
import { setSessionCookie } from '@/lib/auth/cookies';
import { DEMO_MODE } from '@/lib/utils/env';
import { createDemoSession } from '@/lib/demo/session';
import { createHash, randomUUID } from 'crypto';
import { validateReferralCode } from '@/lib/referrals/validation';

const schema = z.object({
  email: z.string().email(),
  chain: z.enum(['base', 'voi', 'solana']),
  address: z.string(),
  signature: z.string(),
  referralCode: z.string().min(7).max(7).optional(), // Optional referral code
  payload: z
    .object({
      nonce: z.string(),
      issuedAt: z.string(),
      expiresAt: z.string(),
      statement: z.string().optional(),
      domain: z.string().optional(),
      message: z.string().optional(),
    })
    .passthrough(),
});

export async function POST(req: NextRequest) {
  const data = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(data);
  if (!parsed.success)
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  const { email, chain, address, signature, payload, referralCode } =
    parsed.data;

  // Demo mode: bypass all verification
  if (DEMO_MODE) {
    console.log('[DEMO] Auth verify - creating demo session');
    const demoSession = createDemoSession();
    const ttlSeconds = 60 * 60 * 24 * 7;
    await setSessionCookie('demo-token', ttlSeconds);
    return NextResponse.json({ ok: true, profileId: demoSession.profileId });
  }

  const now = new Date();

  const supabase = createAdminClient();
  const { data: nonceRow, error: nonceErr } =
    await supabase.from('nonces').select('*').eq('chain', chain).eq('address', address).single();
  if (nonceErr || !nonceRow) return NextResponse.json({ error: 'Nonce not found' }, { status: 400 });
  if (nonceRow.nonce !== payload.nonce) return NextResponse.json({ error: 'Nonce mismatch' }, { status: 400 });
  if (new Date(nonceRow.expires_at) < now) return NextResponse.json({ error: 'Nonce expired' }, { status: 400 });

  const result = await verifySignature({ chain, address, signature, payload });
  if (!result.ok)
    return NextResponse.json({ error: result.error }, { status: 401 });

  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('primary_email', email)
    .single();

  let profile;
  let isNewProfile = false;

  if (existingProfile) {
    profile = existingProfile;
  } else {
    // New profile - join waitlist
    isNewProfile = true;

    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        primary_email: email,
        game_access_granted: false,
        waitlist_joined_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileError || !newProfile) {
      console.error('Profile creation error:', profileError);
      return NextResponse.json(
        { error: `Failed to create profile: ${profileError?.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

    profile = newProfile;
  }

  // Link blockchain account
  await supabase.from('accounts').upsert(
    {
      profile_id: profile.id,
      chain,
      address: result.ok ? result.normalizedAddress : address,
      wallet_provider: chain === 'base' ? 'coinbase-embedded' : 'extern',
      is_primary: true,
    },
    { onConflict: 'chain,address' }
  );

  // Create referral relationship if this is a new profile and referral code provided
  if (isNewProfile && referralCode) {
    const referralValidation = await validateReferralCode(referralCode);
    if (
      referralValidation.valid &&
      referralValidation.referrerId &&
      referralValidation.codeId
    ) {
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
          referred_profile_id: profile.id,
          converted_at: now,
          // Set attributed_at if not already set (from landing page visit)
          attributed_at: currentCode?.attributed_at || now,
        })
        .eq('id', referralValidation.codeId);

      // Create the referral relationship
      await supabase.from('referrals').insert({
        referrer_profile_id: referralValidation.referrerId,
        referred_profile_id: profile.id,
        referral_code_id: referralValidation.codeId,
        is_active: isActive,
        activated_at: isActive ? now : null,
      });
    }
  }

  await supabase
    .from('nonces')
    .delete()
    .eq('chain', chain)
    .eq('address', address);

  const sessionId = randomUUID();
  const ttlSeconds = 60 * 60 * 24 * 7;
  const sessionToken = randomUUID();
  const sessionTokenHash = createHash('sha256').update(sessionToken).digest('hex');

  await supabase.from('sessions').insert({
    id: sessionId,
    profile_id: profile.id,
    cdp_user_id: null,
    cdp_access_token_hash: sessionTokenHash,
    jwt_id: null,
    expires_at: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    ip: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
        req.headers.get('x-real-ip') ?? null,
    user_agent: req.headers.get('user-agent') ?? null,
  });

  await setSessionCookie(sessionToken, ttlSeconds);
  return NextResponse.json({ ok: true, profileId: profile.id });
}
