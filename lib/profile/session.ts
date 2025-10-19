import { getServerSessionFromRequest } from '../auth/session';
import { getProfileWithAccounts, type ProfileWithAccounts } from './data';

/**
 * Get the current authenticated user's full profile
 *
 * This combines session validation with profile data fetching.
 * Returns null if user is not authenticated or profile doesn't exist.
 *
 * @returns Profile with accounts or null
 */
export async function getCurrentProfile(): Promise<ProfileWithAccounts | null> {
  const session = await getServerSessionFromRequest();

  if (!session) {
    return null;
  }

  return getProfileWithAccounts(session.sub);
}

/**
 * Require authentication and return current profile
 *
 * Throws an error if user is not authenticated.
 * Use this in API routes that require authentication.
 *
 * @returns Profile with accounts
 * @throws Error if not authenticated
 */
export async function requireCurrentProfile(): Promise<ProfileWithAccounts> {
  const profile = await getCurrentProfile();

  if (!profile) {
    throw new Error('Authentication required');
  }

  return profile;
}

/**
 * Check if user is authenticated
 *
 * @returns true if user has a valid session
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getServerSessionFromRequest();
  return session !== null;
}

/**
 * Get current user's profile ID
 *
 * @returns Profile ID or null if not authenticated
 */
export async function getCurrentProfileId(): Promise<string | null> {
  const session = await getServerSessionFromRequest();
  return session?.sub || null;
}
