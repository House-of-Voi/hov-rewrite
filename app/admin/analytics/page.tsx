import { requirePermission, PERMISSIONS } from '@/lib/auth/admin';
import AnalyticsClient from '@/components/admin/AnalyticsClient';

export const dynamic = 'force-dynamic';

export default async function AdminAnalytics() {
  await requirePermission(PERMISSIONS.VIEW_ANALYTICS);
  return <AnalyticsClient />;
}

