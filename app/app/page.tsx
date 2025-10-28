import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/profile/session';
import { isUserActivated } from '@/lib/profile/data';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function AppHome() {
  const profileData = await getCurrentProfile();

  // Redirect to auth if not logged in
  if (!profileData) {
    redirect('/auth');
  }

  // Check if user is activated (has entered a referral code)
  const activated = await isUserActivated(profileData.profile.id);

  return <DashboardClient initialData={profileData} isActivated={activated} />;
}
