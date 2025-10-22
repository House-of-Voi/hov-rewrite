import Card, { CardContent, CardHeader } from '@/components/Card';
import StatCard from '@/components/StatCard';
import { CoinsIcon, UsersIcon, TrendingUpIcon, ChartIcon, SlotMachineIcon, BoltIcon } from '@/components/icons';
import ChainBadge from '@/components/ChainBadge';
import { getServerSessionFromRequest } from '@/lib/auth/session';
import { DEMO_MODE } from '@/lib/utils/env';

// Mock admin data - will be replaced with database queries
const dashboardData = {
  treasury: {
    base: 1250.50,
    voi: 850.25,
    solana: 620.75,
    total: 2721.50,
  },
  todayStats: {
    totalWagered: 12450.00,
    totalPayout: 11825.50,
    houseProfit: 624.50,
    activeUsers: 234,
    totalRounds: 1847,
  },
  weekStats: {
    totalWagered: 84320.00,
    totalPayout: 80105.60,
    houseProfit: 4214.40,
  },
  recentGames: [
    { id: '1', player: '0x742d...0bEb', game: 'Slots', bet: 5.00, payout: 50.00, profit: 45.00, chain: 'base' as const, time: '2 min ago' },
    { id: '2', player: 'QLVX...ZQK', game: 'Dice', bet: 1.00, payout: 0.00, profit: -1.00, chain: 'voi' as const, time: '5 min ago' },
    { id: '3', player: '9WzD...AWM', game: 'Slots', bet: 0.50, payout: 1.50, profit: 1.00, chain: 'solana' as const, time: '8 min ago' },
    { id: '4', player: '0x123...abc', game: 'Dice', bet: 10.00, payout: 30.00, profit: 20.00, chain: 'base' as const, time: '12 min ago' },
  ],
  alerts: [
    { id: '1', type: 'warning', message: 'Base treasury below 25% of target', time: '15 min ago' },
    { id: '2', type: 'info', message: 'New high roller detected: 0x742d...0bEb', time: '1 hour ago' },
  ],
};

export default async function AdminDashboard() {
  const session = await getServerSessionFromRequest();

  // Check if user is admin (in production, check admin_roles table)
  const isAdmin = true; // Mock - replace with actual admin check

  if (!session && !DEMO_MODE) {
    return (
      <div className="text-center py-12 space-y-4">
        <h1 className="text-2xl font-bold text-ruby-400">Access Denied</h1>
        <p className="text-neutral-400">
          You do not have permission to access the admin panel.
        </p>
      </div>
    );
  }

  if (!isAdmin && !DEMO_MODE) {
    return (
      <div className="text-center py-12 space-y-4">
        <h1 className="text-2xl font-bold text-ruby-400">Access Denied</h1>
        <p className="text-neutral-400">
          You do not have permission to access the admin panel.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-gold-400 neon-text uppercase">Admin Dashboard</h1>
          <p className="text-neutral-400 mt-2">
            House operations and analytics overview
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/admin/games">
            <button className="px-4 py-2 text-sm border-2 border-gold-500/30 text-gold-400 rounded-lg hover:bg-gold-500/10 transition-colors font-bold uppercase tracking-wide">
              Manage Games
            </button>
          </a>
          <a href="/admin/analytics">
            <button className="px-4 py-2 text-sm border-2 border-gold-500/30 text-gold-400 rounded-lg hover:bg-gold-500/10 transition-colors font-bold uppercase tracking-wide">
              Analytics
            </button>
          </a>
        </div>
      </div>

      {/* Treasury Overview */}
      <Card glow>
        <CardHeader>
          <h2 className="text-2xl font-bold text-gold-400 uppercase flex items-center gap-2">
            <CoinsIcon size={28} />
            House Treasury
          </h2>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6 mb-6">
            <div className="text-center p-6 rounded-xl border border-gold-900/20 bg-gold-500/5">
              <ChainBadge chain="base" />
              <div className="text-3xl font-black text-gold-400 mt-3">
                ${dashboardData.treasury.base.toFixed(2)}
              </div>
            </div>
            <div className="text-center p-6 rounded-xl border border-gold-900/20 bg-royal-500/5">
              <ChainBadge chain="voi" />
              <div className="text-3xl font-black text-gold-400 mt-3">
                ${dashboardData.treasury.voi.toFixed(2)}
              </div>
            </div>
            <div className="text-center p-6 rounded-xl border border-gold-900/20 bg-green-500/5">
              <ChainBadge chain="solana" />
              <div className="text-3xl font-black text-gold-400 mt-3">
                ${dashboardData.treasury.solana.toFixed(2)}
              </div>
            </div>
            <div className="text-center p-6 rounded-xl border-2 border-gold-500/30 bg-gold-500/10">
              <div className="text-sm text-neutral-500 uppercase tracking-wider font-bold mb-2">
                Total Balance
              </div>
              <div className="text-4xl font-black text-gold-400">
                ${dashboardData.treasury.total.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3">
            <button className="px-4 py-2 text-sm bg-gradient-to-r from-gold-500 to-gold-600 text-neutral-950 rounded-lg font-bold uppercase tracking-wide hover:from-gold-400 hover:to-gold-500 transition-colors">
              Fund Treasury
            </button>
            <button className="px-4 py-2 text-sm border-2 border-gold-500/30 text-gold-400 rounded-lg hover:bg-gold-500/10 transition-colors font-bold uppercase tracking-wide">
              Withdraw
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Today's Performance */}
      <div>
        <h2 className="text-2xl font-bold text-gold-400 uppercase mb-4">Today&apos;s Performance</h2>
        <div className="grid md:grid-cols-5 gap-6">
          <StatCard
            title="Total Wagered"
            value={`$${dashboardData.todayStats.totalWagered.toLocaleString()}`}
            subtitle="Across all games"
            icon={<CoinsIcon size={32} />}
          />
          <StatCard
            title="Total Payout"
            value={`$${dashboardData.todayStats.totalPayout.toLocaleString()}`}
            subtitle="Player winnings"
            icon={<TrendingUpIcon size={32} />}
          />
          <StatCard
            title="House Profit"
            value={`$${dashboardData.todayStats.houseProfit.toFixed(2)}`}
            subtitle={`${((dashboardData.todayStats.houseProfit / dashboardData.todayStats.totalWagered) * 100).toFixed(1)}% margin`}
            icon={<ChartIcon size={32} />}
          />
          <StatCard
            title="Active Users"
            value={dashboardData.todayStats.activeUsers}
            subtitle="Unique players"
            icon={<UsersIcon size={32} />}
          />
          <StatCard
            title="Total Rounds"
            value={dashboardData.todayStats.totalRounds}
            subtitle="Games played"
            icon={<SlotMachineIcon size={32} />}
          />
        </div>
      </div>

      {/* Live Activity & Alerts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Live Game Feed */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gold-400 uppercase flex items-center gap-2">
                <BoltIcon size={24} />
                Live Game Feed
              </h3>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-xs text-green-400 font-bold uppercase">Live</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboardData.recentGames.map((game) => (
              <div
                key={game.id}
                className="p-4 rounded-lg border border-gold-900/20 hover:bg-gold-500/5 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <code className="text-xs font-mono text-neutral-400">
                      {game.player}
                    </code>
                    <ChainBadge chain={game.chain} />
                  </div>
                  <div className="text-xs text-neutral-500">{game.time}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-neutral-400">{game.game}</span>
                    <span className="text-neutral-600 mx-2">•</span>
                    <span className="text-neutral-300 font-semibold">${game.bet}</span>
                  </div>
                  <div className={`font-bold ${game.profit > 0 ? 'text-green-400' : 'text-ruby-400'}`}>
                    {game.profit > 0 ? '+' : ''}${game.profit.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}

            <a href="/admin/games" className="block">
              <button className="w-full px-4 py-2 text-sm border border-gold-500/30 text-gold-400 rounded-lg hover:bg-gold-500/10 transition-colors font-bold uppercase tracking-wide">
                View All Activity
              </button>
            </a>
          </CardContent>
        </Card>

        {/* Alerts & Notifications */}
        <Card>
          <CardHeader>
            <h3 className="text-xl font-bold text-gold-400 uppercase">Alerts & Notifications</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboardData.alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-2 ${
                  alert.type === 'warning'
                    ? 'border-ruby-500/30 bg-ruby-500/10'
                    : 'border-gold-500/30 bg-gold-500/10'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`text-xs font-bold uppercase tracking-wider ${
                    alert.type === 'warning' ? 'text-ruby-400' : 'text-gold-400'
                  }`}>
                    {alert.type}
                  </div>
                  <div className="text-xs text-neutral-500">{alert.time}</div>
                </div>
                <div className="text-sm text-neutral-300">
                  {alert.message}
                </div>
              </div>
            ))}

            <div className="text-center pt-4">
              <button className="px-4 py-2 text-sm border border-gold-500/30 text-gold-400 rounded-lg hover:bg-gold-500/10 transition-colors font-bold uppercase tracking-wide">
                View All Alerts
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Summary */}
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-gold-400 uppercase">7-Day Summary</h2>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6">
              <div className="text-sm text-neutral-500 uppercase tracking-wider font-bold mb-2">
                Wagered
              </div>
              <div className="text-3xl font-black text-gold-400">
                ${dashboardData.weekStats.totalWagered.toLocaleString()}
              </div>
            </div>
            <div className="text-center p-6">
              <div className="text-sm text-neutral-500 uppercase tracking-wider font-bold mb-2">
                Paid Out
              </div>
              <div className="text-3xl font-black text-gold-400">
                ${dashboardData.weekStats.totalPayout.toLocaleString()}
              </div>
            </div>
            <div className="text-center p-6">
              <div className="text-sm text-neutral-500 uppercase tracking-wider font-bold mb-2">
                House Profit
              </div>
              <div className="text-3xl font-black text-green-400">
                ${dashboardData.weekStats.houseProfit.toLocaleString()}
              </div>
              <div className="text-sm text-neutral-500 mt-1">
                {((dashboardData.weekStats.houseProfit / dashboardData.weekStats.totalWagered) * 100).toFixed(2)}% margin
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
