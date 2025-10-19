import StatCard from '@/components/StatCard';
import Card, { CardContent, CardHeader } from '@/components/Card';
import { UsersIcon, ChartIcon, CheckCircleIcon, LinkIcon, UserIcon, TicketIcon, PlusIcon } from '@/components/icons';
import { mockStats, mockActivity } from '@/lib/demo/mockData';
import { DEMO_MODE } from '@/lib/utils/env';
import { getServerSessionFromRequest } from '@/lib/auth/session';

export default async function AppHome() {
  const session = await getServerSessionFromRequest();

  if (!session && !DEMO_MODE) {
    return (
      <div className="text-center py-12 space-y-4">
        <h1 className="text-2xl font-bold text-gold-400">Authentication Required</h1>
        <p className="text-neutral-400">
          Please <a href="/auth" className="text-gold-400 hover:text-gold-300 underline">sign in</a> to access your dashboard.
        </p>
      </div>
    );
  }

  // Use mock data in demo mode or when session exists
  const stats = mockStats;
  const activity = mockActivity;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-gold-400 neon-text uppercase">Dashboard</h1>
        <p className="text-neutral-400 mt-2">
          Welcome back! Here's your activity overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Referrals"
          value={stats.totalReferrals}
          subtitle="Active referral codes"
          icon={<UsersIcon size={32} />}
        />
        <StatCard
          title="Attributions"
          value={stats.totalAttributions}
          subtitle="Total clicks tracked"
          icon={<ChartIcon size={32} />}
        />
        <StatCard
          title="Conversions"
          value={stats.convertedReferrals}
          subtitle="Completed sign-ups"
          icon={<CheckCircleIcon size={32} />}
        />
        <StatCard
          title="Linked Accounts"
          value={stats.linkedAccounts}
          subtitle="Connected wallets"
          icon={<LinkIcon size={32} />}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-gold-400 uppercase">Quick Actions</h2>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <a
              href="/app/profile"
              className="p-6 border border-gold-900/20 rounded-xl hover:bg-gold-500/5 transition-all group"
            >
              <div className="text-gold-400 mb-3">
                <UserIcon size={36} />
              </div>
              <div className="font-bold text-gold-400 group-hover:text-gold-300 uppercase tracking-wide">Manage Profile</div>
              <div className="text-sm text-neutral-500 mt-2">
                Update your information
              </div>
            </a>
            <a
              href="/app/profile#referrals"
              className="p-6 border border-gold-900/20 rounded-xl hover:bg-gold-500/5 transition-all group"
            >
              <div className="text-gold-400 mb-3">
                <TicketIcon size={36} />
              </div>
              <div className="font-bold text-gold-400 group-hover:text-gold-300 uppercase tracking-wide">Create Referral</div>
              <div className="text-sm text-neutral-500 mt-2">
                Generate a new code
              </div>
            </a>
            <a
              href="/app/profile#accounts"
              className="p-6 border border-gold-900/20 rounded-xl hover:bg-gold-500/5 transition-all group"
            >
              <div className="text-gold-400 mb-3">
                <PlusIcon size={36} />
              </div>
              <div className="font-bold text-gold-400 group-hover:text-gold-300 uppercase tracking-wide">Link Wallet</div>
              <div className="text-sm text-neutral-500 mt-2">
                Connect another account
              </div>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-gold-400 uppercase">Recent Activity</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activity.map((item, idx) => {
              const icons: Record<string, JSX.Element> = {
                referral_created: <TicketIcon size={28} />,
                account_linked: <LinkIcon size={28} />,
                profile_created: <UserIcon size={28} />,
              };

              return (
                <div key={idx} className="flex items-start gap-4 pb-4 border-b border-gold-900/20 last:border-0">
                  <div className="text-gold-400">{icons[item.type] || <TicketIcon size={28} />}</div>
                  <div className="flex-1">
                    <p className="font-medium text-neutral-200">{item.message}</p>
                    <p className="text-sm text-neutral-500 mt-1">
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
