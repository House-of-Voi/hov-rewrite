import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  // Profile is now merged with dashboard
  redirect('/app');
}
