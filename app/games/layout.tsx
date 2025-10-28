import { Suspense } from 'react';
import { getServerSessionFromRequest, hasGameAccess } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/db/supabaseAdmin';
import WaitlistInline from '@/components/WaitlistInline';

// Separate async component for waitlist data
async function WaitlistInfo({ session }: { session: { profileId: string } }) {
  const supabase = createAdminClient();

  // Fetch all waitlist data in parallel
  const [profileResult, referralResult, waitlistCountResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, game_access_granted, waitlist_position, waitlist_joined_at')
      .eq('id', session.profileId)
      .single(),
    supabase
      .from('referrals')
      .select('id')
      .eq('referred_profile_id', session.profileId)
      .single(),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('game_access_granted', false),
  ]);

  const profile = profileResult.data;
  const referral = referralResult.data;
  const waitlistCount = waitlistCountResult.count;

  return (
    <div className="animate-in fade-in duration-500">
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

// Loading skeleton for waitlist info
function WaitlistSkeleton() {
  return (
    <div className="bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-800 rounded-xl p-6 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="h-8 w-8 bg-primary-200 dark:bg-primary-800 rounded-full"></div>
        <div className="flex-1 space-y-3">
          <div className="h-5 w-64 bg-primary-200 dark:bg-primary-800 rounded"></div>
          <div className="h-4 w-96 bg-primary-200 dark:bg-primary-800 rounded"></div>
        </div>
      </div>
    </div>
  );
}

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
    // User is authenticated but on waitlist - show inline waitlist status above games
    // Use Suspense to stream in the waitlist data
    return (
      <div className="space-y-8">
        <Suspense fallback={<WaitlistSkeleton />}>
          <WaitlistInfo session={{ profileId: session.profileId }} />
        </Suspense>
        {children}
      </div>
    );
  }

  // User has game access - show games normally
  return <>{children}</>;
}
