import Link from 'next/link';
import { getServerSessionFromRequest } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/db/supabaseAdmin';

/**
 * Games navigation link with conditional styling based on user's waitlist status
 * - If user has game access: Normal clickable link
 * - If user is on waitlist: Disabled/grayed out with tooltip
 * - If user is not logged in: Normal link (will be handled by games layout)
 */
export default async function GamesNavLink() {
  const session = await getServerSessionFromRequest();

  // If no session, show normal link (games layout will handle redirect)
  if (!session) {
    return (
      <Link
        href="/games"
        className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all"
      >
        Games
      </Link>
    );
  }

  // Check if user has game access
  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('game_access_granted')
    .eq('id', session.profileId)
    .single();

  const hasAccess = profile?.game_access_granted || false;

  // If user has access, show normal link
  if (hasAccess) {
    return (
      <Link
        href="/games"
        className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all"
      >
        Games
      </Link>
    );
  }

  // User is on waitlist - show normal link (they can view their waitlist status)
  return (
    <Link
      href="/games"
      className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all"
    >
      Games
    </Link>
  );
}
