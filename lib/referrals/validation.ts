import { createAdminClient } from '@/lib/db/supabaseAdmin';
import { isValidReferralCodeFormat } from '@/lib/utils/referral';

export interface ReferralValidationResult {
  valid: boolean;
  exists?: boolean;
  canAcceptReferrals?: boolean;
  atCapacity?: boolean;
  referrerName?: string;
  referrerId?: string;
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

  // Find the profile with this referral code
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, display_name, primary_email, max_referrals')
    .eq('referral_code', code.toUpperCase())
    .single();

  if (error || !profile) {
    return {
      valid: false,
      exists: false,
      error: 'Referral code not found',
    };
  }

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
  };
}

/**
 * Get referral stats for a profile
 */
export interface ReferralStats {
  referralCode: string;
  activeReferrals: number;
  maxReferrals: number;
  queuedReferrals: number;
  totalReferrals: number;
}

export async function getReferralStats(
  profileId: string
): Promise<ReferralStats | null> {
  const supabase = createAdminClient();

  // Get profile info
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('referral_code, max_referrals')
    .eq('id', profileId)
    .single();

  if (profileError || !profile || !profile.referral_code) {
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

  return {
    referralCode: profile.referral_code,
    activeReferrals: activeCount as number,
    maxReferrals: profile.max_referrals,
    queuedReferrals: queuedCount || 0,
    totalReferrals: totalCount || 0,
  };
}
