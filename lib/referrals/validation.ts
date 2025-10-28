import { createAdminClient } from '@/lib/db/supabaseAdmin';
import { isValidReferralCodeFormat } from '@/lib/utils/referral';

export interface ReferralValidationResult {
  valid: boolean;
  exists?: boolean;
  canAcceptReferrals?: boolean;
  atCapacity?: boolean;
  referrerName?: string;
  referrerId?: string;
  codeId?: string;
  alreadyUsed?: boolean;
  deactivated?: boolean;
  error?: string;
}

/**
 * Validate a referral code and check if it can accept new referrals
 */
export async function validateReferralCode(
  code: string
): Promise<ReferralValidationResult> {
  // Check format first
  if (!isValidReferralCodeFormat(code)) {
    return {
      valid: false,
      error: 'Invalid referral code format',
    };
  }

  const supabase = createAdminClient();

  // Find the referral code
  const { data: referralCode, error: codeError } = await supabase
    .from('referral_codes')
    .select(
      `
      id,
      referrer_profile_id,
      referred_profile_id,
      deactivated_at,
      profiles!referral_codes_referrer_profile_id_fkey (
        id,
        display_name,
        primary_email,
        max_referrals
      )
    `
    )
    .eq('code', code.toUpperCase())
    .maybeSingle();

  if (codeError || !referralCode) {
    return {
      valid: false,
      exists: false,
      error: 'Referral code not found',
    };
  }

  // Check if code is deactivated
  if (referralCode.deactivated_at) {
    return {
      valid: false,
      exists: true,
      deactivated: true,
      error: 'Referral code has been deactivated',
    };
  }

  // Check if code is already used
  if (referralCode.referred_profile_id) {
    return {
      valid: false,
      exists: true,
      alreadyUsed: true,
      error: 'Referral code has already been used',
    };
  }

  const profile = referralCode.profiles as unknown as {
    id: string;
    display_name: string | null;
    primary_email: string;
    max_referrals: number;
  };

  // Count active referrals using our database function
  const { data: countResult, error: countError } = await supabase.rpc(
    'count_active_referrals',
    {
      p_profile_id: profile.id,
    }
  );

  if (countError) {
    return {
      valid: false,
      error: 'Error checking referral capacity',
    };
  }

  const activeCount = countResult as number;
  const canAccept = activeCount < profile.max_referrals;

  return {
    valid: true,
    exists: true,
    canAcceptReferrals: canAccept,
    atCapacity: !canAccept,
    referrerName: profile.display_name || profile.primary_email,
    referrerId: profile.id,
    codeId: referralCode.id,
    alreadyUsed: false,
    deactivated: false,
  };
}

/**
 * Get referral stats for a profile
 */
export interface ReferralCodeInfo {
  id: string;
  code: string;
  referredProfileId: string | null;
  referredUserName: string | null;
  referredUserAvatar: string | null;
  attributedAt: string | null;
  convertedAt: string | null;
  deactivatedAt: string | null;
  createdAt: string;
}

export interface ReferralStats {
  codesGenerated: number;
  codesAvailable: number;
  maxReferrals: number;
  activeReferrals: number;
  queuedReferrals: number;
  totalReferrals: number;
  codes: ReferralCodeInfo[];
}

export async function getReferralStats(
  profileId: string
): Promise<ReferralStats | null> {
  const supabase = createAdminClient();

  // Get profile info
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('max_referrals')
    .eq('id', profileId)
    .single();

  if (profileError || !profile) {
    return null;
  }

  // Get all referral codes for this user with referred user info
  const { data: codes, error: codesError } = await supabase
    .from('referral_codes')
    .select(`
      *,
      referred_profile:profiles!referral_codes_referred_profile_id_fkey (
        display_name,
        avatar_url
      )
    `)
    .eq('referrer_profile_id', profileId)
    .order('created_at', { ascending: false });

  if (codesError) {
    return null;
  }

  // Get active referral count
  const { data: activeCount, error: activeError } = await supabase.rpc(
    'count_active_referrals',
    {
      p_profile_id: profileId,
    }
  );

  if (activeError) {
    return null;
  }

  // Get queued (inactive) referral count
  const { count: queuedCount, error: queuedError } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_profile_id', profileId)
    .eq('is_active', false)
    .not('referred_profile_id', 'is', null);

  if (queuedError) {
    return null;
  }

  // Get total referral count
  const { count: totalCount, error: totalError } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_profile_id', profileId)
    .not('referred_profile_id', 'is', null);

  if (totalError) {
    return null;
  }

  // Count non-deactivated codes
  const codesGenerated = codes.filter((c) => !c.deactivated_at).length;
  const codesAvailable = profile.max_referrals - codesGenerated;

  return {
    codesGenerated,
    codesAvailable,
    maxReferrals: profile.max_referrals,
    activeReferrals: activeCount as number,
    queuedReferrals: queuedCount || 0,
    totalReferrals: totalCount || 0,
    codes: codes.map((c) => {
      // Supabase may return referred_profile as an array or object
      const referredProfile = c.referred_profile
        ? (Array.isArray(c.referred_profile) ? c.referred_profile[0] : c.referred_profile)
        : null;

      return {
        id: c.id,
        code: c.code,
        referredProfileId: c.referred_profile_id,
        referredUserName: referredProfile
          ? (referredProfile as { display_name: string | null; avatar_url: string | null }).display_name
          : null,
        referredUserAvatar: referredProfile
          ? (referredProfile as { display_name: string | null; avatar_url: string | null }).avatar_url
          : null,
        attributedAt: c.attributed_at,
        convertedAt: c.converted_at,
        deactivatedAt: c.deactivated_at,
        createdAt: c.created_at,
      };
    }),
  };
}
