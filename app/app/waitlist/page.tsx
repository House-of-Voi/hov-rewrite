import { getServerSessionFromRequest } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/db/supabaseAdmin';
import WaitlistClient from './WaitlistClient';

export default async function WaitlistPage() {
  const session = await getServerSessionFromRequest();

  if (!session) {
    redirect('/auth');
  }

  const supabase = createAdminClient();

  // Get profile with referral info
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, primary_email, display_name, referral_code, game_access_granted, waitlist_position, waitlist_joined_at')
    .eq('id', session.profileId)
    .single();

  if (!profile) {
    redirect('/auth');
  }

  // If user has access, redirect to dashboard
  if (profile.game_access_granted) {
    redirect('/app');
  }

  // Check if user has a referral
  const { data: referral } = await supabase
    .from('referrals')
    .select('referrer_profile_id, is_active, created_at')
    .eq('referred_profile_id', profile.id)
    .single();

  // Get referrer info if exists
  let referrerInfo = null;
  if (referral) {
    const { data: referrerProfile } = await supabase
      .from('profiles')
      .select('display_name, primary_email')
      .eq('id', referral.referrer_profile_id)
      .single();

    if (referrerProfile) {
      referrerInfo = {
        name: referrerProfile.display_name || referrerProfile.primary_email,
        isActive: referral.is_active,
      };
    }
  }

  // Count total users on waitlist
  const { count: waitlistCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('game_access_granted', false);

  return (
    <WaitlistClient
      profile={{
        id: profile.id,
        email: profile.primary_email,
        displayName: profile.display_name,
        waitlistPosition: profile.waitlist_position,
        joinedAt: profile.waitlist_joined_at,
      }}
      hasReferral={!!referral}
      referrerInfo={referrerInfo}
      totalOnWaitlist={waitlistCount || 0}
    />
  );
}
