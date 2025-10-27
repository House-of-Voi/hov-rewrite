import Link from 'next/link';
import { isAdmin } from '@/lib/auth/admin';

/**
 * Admin navigation link for the main header bar.
 *
 * Rendered only when the current user has any admin role.
 */
export default async function AdminNavLink() {
  const hasAdminAccess = await isAdmin();

  if (!hasAdminAccess) {
    return null;
  }

  return (
    <Link
      href="/admin"
      className="px-5 py-2.5 text-sm font-bold text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300 hover:bg-accent-50 dark:hover:bg-accent-900/20 rounded-lg transition-all tracking-wide uppercase"
    >
      Admin
    </Link>
  );
}
