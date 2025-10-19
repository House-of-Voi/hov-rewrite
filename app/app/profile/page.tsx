import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/profile/session';
import ProfileClient from './ProfileClient';

export default async function ProfilePage() {
  const profileData = await getCurrentProfile();

  // Redirect to auth if not logged in
  if (!profileData) {
    redirect('/auth');
  }

  return <ProfileClient initialData={profileData} />;
}
