import { requirePermission, PERMISSIONS } from '@/lib/auth/admin';
import DashboardClient from '@/components/admin/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  // Ensure user has permission to view analytics
  await requirePermission(PERMISSIONS.VIEW_ANALYTICS);

  return <DashboardClient />;
}
