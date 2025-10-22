import { getServerSessionFromRequest } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/db/supabaseAdmin';
import WaitlistAdminClient from './WaitlistAdminClient';

export default async function AdminWaitlistPage() {
  const session = await getServerSessionFromRequest();

  if (!session) {
    redirect('/auth');
  }

  const supabase = createAdminClient();

  // Check if user is an admin
  const { data: adminRole } = await supabase
    .from('admin_roles')
    .select('role')
    .eq('profile_id', session.profileId)
    .single();

  if (!adminRole) {
    redirect('/app');
  }

  // Get all waitlist users
  const { data: waitlistUsers } = await supabase
    .from('profiles')
    .select('id, primary_email, display_name, waitlist_position, waitlist_joined_at, game_access_granted, created_at')
    .eq('game_access_granted', false)
    .order('waitlist_joined_at', { ascending: true });

  // Get referral info for each user
  const usersWithReferrals = await Promise.all(
    (waitlistUsers || []).map(async (user) => {
      const { data: referral } = await supabase
        .from('referrals')
        .select(`
          is_active,
          referrer_profile:referrer_profile_id (
            primary_email,
            display_name
          )
        `)
        .eq('referred_profile_id', user.id)
        .single();

      return {
        ...user,
        referral: referral
          ? {
              isActive: referral.is_active,
              referrerName:
                (referral.referrer_profile as unknown as { display_name?: string; primary_email: string })
                  ?.display_name ||
                (referral.referrer_profile as unknown as { primary_email: string })?.primary_email ||
                'Unknown',
            }
          : null,
      };
    })
  );

  // Get count of users with access
  const { count: approvedCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('game_access_granted', true);

  return (
    <WaitlistAdminClient
      waitlistUsers={usersWithReferrals}
      approvedCount={approvedCount || 0}
    />
  );
}
