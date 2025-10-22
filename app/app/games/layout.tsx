import { getServerSessionFromRequest, hasGameAccess } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export default async function GamesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSessionFromRequest();

  // Check if user is authenticated
  if (!session) {
    redirect('/auth');
  }

  // Check if user has game access
  const access = await hasGameAccess();

  if (!access) {
    redirect('/app/waitlist');
  }

  return <>{children}</>;
}
