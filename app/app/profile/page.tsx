import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  // Profile is now merged with dashboard
  redirect('/app');
}
