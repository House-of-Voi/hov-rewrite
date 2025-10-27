import { requirePermission, PERMISSIONS } from '@/lib/auth/admin';
import DashboardClient from '@/components/admin/DashboardClient';

export default async function AdminDashboard() {
  // Ensure user has permission to view analytics
  await requirePermission(PERMISSIONS.VIEW_ANALYTICS);

  return <DashboardClient />;
}
