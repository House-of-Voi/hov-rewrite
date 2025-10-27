import { getServerSessionFromRequest, hasGameAccess } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/db/supabaseAdmin';
import WaitlistInline from '@/components/WaitlistInline';

export default async function GamesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSessionFromRequest();

  // If user is not authenticated, allow them to browse games (no redirect)
  // The games page and individual game pages will handle showing appropriate CTAs
  if (!session) {
    return <>{children}</>;
  }

  // Check if authenticated user has game access
  const access = await hasGameAccess();

  if (!access) {
    // User is authenticated but on waitlist - show inline waitlist status
    const supabase = createAdminClient();

    // Get profile with waitlist info
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, game_access_granted, waitlist_position, waitlist_joined_at')
      .eq('id', session.profileId)
      .single();

    // Check if user has a referral
    const { data: referral } = await supabase
      .from('referrals')
      .select('id')
      .eq('referred_profile_id', session.profileId)
      .single();

    // Count total users on waitlist
    const { count: waitlistCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('game_access_granted', false);

    return (
      <div className="space-y-8">
        <WaitlistInline
          waitlistPosition={profile?.waitlist_position || null}
          joinedAt={profile?.waitlist_joined_at || null}
          hasReferral={!!referral}
          totalOnWaitlist={waitlistCount || 0}
          showFullLink={true}
        />
      </div>
    );
  }

  // User has game access - show games normally
  return <>{children}</>;
}
