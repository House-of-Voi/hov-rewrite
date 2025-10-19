import Card, { CardContent, CardHeader } from '@/components/Card';
import { TrendingUpIcon, UsersIcon, CoinsIcon, ChartIcon } from '@/components/icons';

// Mock analytics data
const analyticsData = {
  daily: [
    { date: '2025-01-08', wagered: 8420, payout: 8102, profit: 318, users: 187, rounds: 1240 },
    { date: '2025-01-09', wagered: 9130, payout: 8745, profit: 385, users: 201, rounds: 1315 },
    { date: '2025-01-10', wagered: 11240, payout: 10876, profit: 364, users: 234, rounds: 1520 },
    { date: '2025-01-11', wagered: 10850, payout: 10412, profit: 438, users: 219, rounds: 1478 },
    { date: '2025-01-12', wagered: 12670, payout: 12045, profit: 625, users: 256, rounds: 1689 },
    { date: '2025-01-13', wagered: 13420, payout: 12893, profit: 527, users: 271, rounds: 1754 },
    { date: '2025-01-14', wagered: 12450, payout: 11826, profit: 624, users: 234, rounds: 1847 },
  ],
  topGames: [
    { name: '5-Reel Slots', wagered: 84320, profit: 2130, rounds: 9847 },
    { name: 'Dice Roll', wagered: 32150, profit: 482, rounds: 4521 },
    { name: 'Blackjack', wagered: 0, profit: 0, rounds: 0 },
  ],
  topPlayers: [
    { address: '0x742d35Cc...0bEb', wagered: 4520, profit: -320, wins: 45, losses: 67 },
    { address: 'QLVXZQKF...ZQK', wagered: 3210, profit: 185, wins: 89, losses: 71 },
    { address: '9WzDXwBb...AWM', wagered: 2840, profit: -95, wins: 52, losses: 58 },
    { address: '0x123abc...def', wagered: 2310, profit: 420, wins: 71, losses: 49 },
  ],
  chainDistribution: [
    { chain: 'Base', wagered: 68420, payout: 65782, profit: 2638, percentage: 58.7 },
    { chain: 'Voi', wagered: 32150, payout: 31213, profit: 937, percentage: 27.6 },
    { chain: 'Solana', wagered: 15900, payout: 15423, profit: 477, percentage: 13.7 },
  ],
};

export default function AdminAnalytics() {
  const totalWagered = analyticsData.daily.reduce((sum, day) => sum + day.wagered, 0);
  const totalProfit = analyticsData.daily.reduce((sum, day) => sum + day.profit, 0);
  const avgDailyUsers = Math.round(analyticsData.daily.reduce((sum, day) => sum + day.users, 0) / analyticsData.daily.length);
  const avgHouseEdge = ((totalProfit / totalWagered) * 100).toFixed(2);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-gold-400 neon-text uppercase">Analytics</h1>
          <p className="text-neutral-400 mt-2">
            Detailed performance metrics and insights
          </p>
        </div>
        <a href="/admin">
          <button className="px-4 py-2 text-sm border-2 border-gold-500/30 text-gold-400 rounded-lg hover:bg-gold-500/10 transition-colors font-bold uppercase tracking-wide">
            ← Dashboard
          </button>
        </a>
      </div>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card glow>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-neutral-500 uppercase tracking-wider font-bold">
                7-Day Volume
              </div>
              <TrendingUpIcon size={24} className="text-gold-400" />
            </div>
            <div className="text-3xl font-black text-gold-400">
              ${totalWagered.toLocaleString()}
            </div>
            <div className="text-xs text-green-400 mt-2">
              +12.3% vs last week
            </div>
          </CardContent>
        </Card>

        <Card glow>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-neutral-500 uppercase tracking-wider font-bold">
                7-Day Profit
              </div>
              <CoinsIcon size={24} className="text-gold-400" />
            </div>
            <div className="text-3xl font-black text-green-400">
              ${totalProfit.toLocaleString()}
            </div>
            <div className="text-xs text-neutral-500 mt-2">
              {avgHouseEdge}% effective edge
            </div>
          </CardContent>
        </Card>

        <Card glow>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-neutral-500 uppercase tracking-wider font-bold">
                Avg Daily Users
              </div>
              <UsersIcon size={24} className="text-gold-400" />
            </div>
            <div className="text-3xl font-black text-gold-400">
              {avgDailyUsers}
            </div>
            <div className="text-xs text-green-400 mt-2">
              +8.7% vs last week
            </div>
          </CardContent>
        </Card>

        <Card glow>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-neutral-500 uppercase tracking-wider font-bold">
                Total Rounds
              </div>
              <ChartIcon size={24} className="text-gold-400" />
            </div>
            <div className="text-3xl font-black text-gold-400">
              {analyticsData.daily.reduce((sum, day) => sum + day.rounds, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Performance Chart (Simplified) */}
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-gold-400 uppercase">Daily Performance (7 Days)</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analyticsData.daily.map((day, idx) => {
              const maxWagered = Math.max(...analyticsData.daily.map(d => d.wagered));
              const barWidth = (day.wagered / maxWagered) * 100;

              return (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4 w-48">
                      <span className="text-neutral-400 font-mono text-xs">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-neutral-500">{day.users} users</span>
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="h-8 bg-neutral-900 rounded-lg overflow-hidden border border-gold-900/20">
                        <div
                          className="h-full bg-gradient-to-r from-gold-500 to-gold-600 flex items-center px-3"
                          style={{ width: `${barWidth}%` }}
                        >
                          <span className="text-xs font-bold text-neutral-950 whitespace-nowrap">
                            ${day.wagered.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right w-32">
                      <div className={`font-bold ${day.profit > 0 ? 'text-green-400' : 'text-ruby-400'}`}>
                        +${day.profit}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {((day.profit / day.wagered) * 100).toFixed(1)}% edge
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Game Performance & Chain Distribution */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Games */}
        <Card>
          <CardHeader>
            <h3 className="text-xl font-bold text-gold-400 uppercase">Game Performance</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {analyticsData.topGames.map((game, idx) => (
              <div key={idx} className="p-4 rounded-lg border border-gold-900/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-neutral-200">{game.name}</div>
                  <div className="text-gold-400 font-bold">${game.profit}</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-neutral-500">Wagered</div>
                    <div className="text-neutral-300 font-semibold">${game.wagered.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-neutral-500">Rounds</div>
                    <div className="text-neutral-300 font-semibold">{game.rounds.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-neutral-500">Edge</div>
                    <div className="text-neutral-300 font-semibold">
                      {game.wagered > 0 ? ((game.profit / game.wagered) * 100).toFixed(2) : '0.00'}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Chain Distribution */}
        <Card>
          <CardHeader>
            <h3 className="text-xl font-bold text-gold-400 uppercase">Chain Distribution</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {analyticsData.chainDistribution.map((item, idx) => (
              <div key={idx} className="p-4 rounded-lg border border-gold-900/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-bold text-neutral-200">{item.chain}</div>
                  <div className="text-gold-400 font-bold">{item.percentage}%</div>
                </div>
                <div className="h-2 bg-neutral-900 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-gradient-to-r from-gold-500 to-gold-600"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-neutral-500">Wagered</div>
                    <div className="text-neutral-300 font-semibold">${item.wagered.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-neutral-500">Payout</div>
                    <div className="text-neutral-300 font-semibold">${item.payout.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-neutral-500">Profit</div>
                    <div className="text-green-400 font-semibold">${item.profit}</div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Top Players */}
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-gold-400 uppercase">Top Players (7 Days)</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analyticsData.topPlayers.map((player, idx) => (
              <div key={idx} className="p-4 rounded-lg border border-gold-900/20 hover:bg-gold-500/5 transition-colors">
                <div className="grid md:grid-cols-6 gap-4 items-center">
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center text-neutral-950 font-black">
                        #{idx + 1}
                      </div>
                      <code className="text-sm font-mono text-neutral-300">
                        {player.address}
                      </code>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-neutral-500">Wagered</div>
                    <div className="font-bold text-neutral-300">${player.wagered}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-neutral-500">Net P/L</div>
                    <div className={`font-bold ${player.profit >= 0 ? 'text-green-400' : 'text-ruby-400'}`}>
                      {player.profit >= 0 ? '+' : ''}${player.profit}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-neutral-500">Win Rate</div>
                    <div className="font-bold text-neutral-300">
                      {((player.wins / (player.wins + player.losses)) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-neutral-500">W/L</div>
                    <div className="font-bold text-neutral-300">
                      {player.wins}/{player.losses}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
