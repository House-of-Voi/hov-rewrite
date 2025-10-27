import { cookies } from 'next/headers';
import { SESSION_COOKIE } from './cookies';
import { createAdminClient } from '../db/supabaseAdmin';

/**
 * Session information for the authenticated user
 */
export interface SessionInfo {
  sub: string; // profile_id
  cdpUserId?: string;
  baseWalletAddress?: string;
  jti?: string; // For backward compatibility
  profileId: string; // Alias for sub for clarity
  gameAccessGranted?: boolean;
  displayName?: string | null;
  primaryEmail?: string;
}

export async function getServerSessionFromRequest(): Promise<SessionInfo | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const supabase = createAdminClient();
    const { createHash } = await import('crypto');

    // Hash the token to look up the session
    const tokenHash = createHash('sha256').update(token).digest('hex');

    // Look up session by token hash instead of calling CDP API
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, profile_id, cdp_user_id, expires_at')
      .eq('cdp_access_token_hash', tokenHash)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // If no valid session found in database, return null
    if (sessionError || !session) {
      console.log('No valid session found for token hash');
      return null;
    }

    // Get profile to check game access and display name
    const { data: profile } = await supabase
      .from('profiles')
      .select('game_access_granted, display_name, primary_email')
      .eq('id', session.profile_id)
      .single();

    // Get the Base wallet address from accounts table
    const { data: baseAccount } = await supabase
      .from('accounts')
      .select('address')
      .eq('profile_id', session.profile_id)
      .eq('chain', 'base')
      .single();

    return {
      sub: session.profile_id,
      profileId: session.profile_id,
      cdpUserId: session.cdp_user_id,
      baseWalletAddress: baseAccount?.address,
      gameAccessGranted: profile?.game_access_granted || false,
      displayName: profile?.display_name,
      primaryEmail: profile?.primary_email,
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

/**
 * Gets the current user's Algorand account information
 *
 * This function retrieves the derived Algorand (Voi) account for the
 * authenticated user. It hides the Base wallet address and only returns
 * the Algorand address that users interact with.
 *
 * @returns Algorand account info or null if not authenticated
 */
export async function getCurrentAlgorandAccount(): Promise<{
  address: string;
  profileId: string;
  cdpUserId?: string;
} | null> {
  const session = await getServerSessionFromRequest();
  if (!session) return null;

  const supabase = createAdminClient();

  // Get the Algorand account (chain='voi', is_primary=true)
  const { data: account } = await supabase
    .from('accounts')
    .select('address')
    .eq('profile_id', session.sub)
    .eq('chain', 'voi')
    .eq('is_primary', true)
    .single();

  if (!account) return null;

  return {
    address: account.address,
    profileId: session.sub,
    cdpUserId: session.cdpUserId,
  };
}

/**
 * Gets all accounts for the current user (for advanced use cases)
 *
 * @returns Array of all linked accounts
 */
export async function getCurrentUserAccounts(): Promise<Array<{
  chain: string;
  address: string;
  isPrimary: boolean;
  derivedFromChain: string | null;
  derivedFromAddress: string | null;
}> | null> {
  const session = await getServerSessionFromRequest();
  if (!session) return null;

  const supabase = createAdminClient();

  const { data: accounts } = await supabase
    .from('accounts')
    .select('chain, address, is_primary, derived_from_chain, derived_from_address')
    .eq('profile_id', session.sub);

  if (!accounts) return null;

  return accounts.map(acc => ({
    chain: acc.chain,
    address: acc.address,
    isPrimary: acc.is_primary,
    derivedFromChain: acc.derived_from_chain,
    derivedFromAddress: acc.derived_from_address,
  }));
}

/**
 * Checks if the current user has access to games
 *
 * @returns true if user has game access, false otherwise
 */
export async function hasGameAccess(): Promise<boolean> {
  const session = await getServerSessionFromRequest();
  return session?.gameAccessGranted || false;
}
