import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function ReferralsPage() {
  // Referral management is now a modal in the dashboard
  redirect('/app');
}
