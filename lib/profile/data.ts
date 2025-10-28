import { createAdminClient } from '../db/supabaseAdmin';

/**
 * Profile with all related data
 */
export interface ProfileData {
  id: string;
  primary_email: string;
  display_name: string | null;
  avatar_url: string | null;
  max_referrals: number;
  game_access_granted: boolean;
  waitlist_position: number | null;
  waitlist_joined_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Account linked to a profile
 */
export interface AccountData {
  id: string;
  profile_id: string;
  chain: 'base' | 'voi' | 'solana';
  address: string;
  wallet_provider: 'coinbase-embedded' | 'extern';
  is_primary: boolean;
  derived_from_chain: string | null;
  derived_from_address: string | null;
  created_at: string;
}

/**
 * Complete profile with accounts
 */
export interface ProfileWithAccounts {
  profile: ProfileData;
  accounts: AccountData[];
  primaryAccount: AccountData | null;
}

/**
 * Get profile by ID
 *
 * @param profileId - UUID of the profile
 * @returns Profile data or null if not found
 */
export async function getProfileById(profileId: string): Promise<ProfileData | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as ProfileData;
}

/**
 * Get profile by email
 *
 * @param email - Primary email address
 * @returns Profile data or null if not found
 */
export async function getProfileByEmail(email: string): Promise<ProfileData | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('primary_email', email)
    .single();

  if (error || !data) {
    return null;
  }

  return data as ProfileData;
}

/**
 * Get all accounts linked to a profile
 *
 * @param profileId - UUID of the profile
 * @returns Array of account data
 */
export async function getProfileAccounts(profileId: string): Promise<AccountData[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('profile_id', profileId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as AccountData[];
}

/**
 * Get profile with all linked accounts
 *
 * @param profileId - UUID of the profile
 * @returns Profile with accounts or null if profile not found
 */
export async function getProfileWithAccounts(
  profileId: string
): Promise<ProfileWithAccounts | null> {
  const profile = await getProfileById(profileId);

  if (!profile) {
    return null;
  }

  const accounts = await getProfileAccounts(profileId);
  const primaryAccount = accounts.find((acc) => acc.is_primary) || null;

  return {
    profile,
    accounts,
    primaryAccount,
  };
}

/**
 * Update profile information
 *
 * @param profileId - UUID of the profile
 * @param updates - Fields to update
 * @returns Updated profile or null if update failed
 */
export async function updateProfile(
  profileId: string,
  updates: {
    display_name?: string | null;
    avatar_url?: string | null;
  }
): Promise<ProfileData | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', profileId)
    .select()
    .single();

  if (error || !data) {
    console.error('Profile update error:', error);
    return null;
  }

  return data as ProfileData;
}

/**
 * Get profile by CDP user ID
 *
 * Looks up the profile associated with a Coinbase CDP user ID
 * by finding the session with that CDP user ID.
 *
 * @param cdpUserId - Coinbase CDP user identifier
 * @returns Profile data or null if not found
 */
export async function getProfileByCdpUserId(cdpUserId: string): Promise<ProfileData | null> {
  const supabase = createAdminClient();

  // Find the most recent active session for this CDP user
  const { data: session } = await supabase
    .from('sessions')
    .select('profile_id')
    .eq('cdp_user_id', cdpUserId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!session) {
    return null;
  }

  return getProfileById(session.profile_id);
}

/**
 * Check if an account (chain + address) is already linked to any profile
 *
 * @param chain - Blockchain chain
 * @param address - Wallet address
 * @returns Profile ID if account exists, null otherwise
 */
export async function getProfileIdByAccount(
  chain: 'base' | 'voi' | 'solana',
  address: string
): Promise<string | null> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('accounts')
    .select('profile_id')
    .eq('chain', chain)
    .eq('address', address.toLowerCase())
    .single();

  return data?.profile_id || null;
}

/**
 * Check if a user is an admin
 *
 * @param profileId - UUID of the profile
 * @returns True if user has an admin role, false otherwise
 */
export async function isUserAdmin(profileId: string): Promise<boolean> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('admin_roles')
    .select('profile_id')
    .eq('profile_id', profileId)
    .single();

  return !!data;
}

/**
 * Check if a user is activated (has entered a referral code)
 *
 * A user is considered activated when they exist in the referrals table
 * as a referred_profile_id, meaning they have entered a referral code.
 * Admins are automatically considered activated.
 *
 * @param profileId - UUID of the profile
 * @returns True if user has entered a referral code or is an admin, false otherwise
 */
export async function isUserActivated(profileId: string): Promise<boolean> {
  const supabase = createAdminClient();

  // Check if user is an admin first
  const isAdmin = await isUserAdmin(profileId);
  if (isAdmin) {
    return true;
  }

  // Check if user has a referral
  const { data } = await supabase
    .from('referrals')
    .select('id')
    .eq('referred_profile_id', profileId)
    .single();

  return !!data;
}
