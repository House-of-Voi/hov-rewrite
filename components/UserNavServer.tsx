import { getCurrentProfile } from '@/lib/profile/session';
import UserNav from './UserNav';

/**
 * Server component wrapper for UserNav
 *
 * Fetches the user profile on the server to avoid hydration flash
 */
export default async function UserNavServer() {
  const profileData = await getCurrentProfile();

  return <UserNav initialProfile={profileData?.profile || null} />;
}
