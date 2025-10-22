import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/profile/session';
import DashboardClient from './DashboardClient';

export default async function AppHome() {
  const profileData = await getCurrentProfile();

  // Redirect to auth if not logged in
  if (!profileData) {
    redirect('/auth');
  }

  return <DashboardClient initialData={profileData} />;
}
