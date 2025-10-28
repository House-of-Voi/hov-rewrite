import { requirePermission, PERMISSIONS } from '@/lib/auth/admin';
import GamesClient from '@/components/admin/GamesClient';

export const dynamic = 'force-dynamic';

export default async function AdminGamesPage() {
  await requirePermission(PERMISSIONS.VIEW_GAMES);
  return <GamesClient />;
}

