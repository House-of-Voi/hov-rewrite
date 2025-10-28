import { Suspense } from 'react';
import Card, { CardContent, CardHeader } from '@/components/Card';
import Button from '@/components/Button';
import { SlotMachineIcon, TrendingUpIcon } from '@/components/icons';
import ChainBadge from '@/components/ChainBadge';

export const dynamic = 'force-dynamic';
import {
  getAggregatedProfileStatsSafe,
  serializeAggregatedProfileStats,
  type AggregatedProfileStatsPayload,
} from '@/lib/mimir/aggregation';
import {
  getServerSessionFromRequest,
  type SessionInfo,
} from '@/lib/auth/session';
import { getProfileWithAccounts } from '@/lib/profile/data';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatVoi,
  truncateAddress,
} from '@/lib/utils/format';
import {
  PlatformStatsSkeleton,
  GamesGridSkeleton,
  WinnersTableSkeleton,
  ProfileStatsSkeleton,
} from '@/components/GamesSkeleton';

interface SlotConfig {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  theme: string | null;
  contract_id: number;
  chain: 'base' | 'voi' | 'solana';
  rtp_target: string;
  house_edge: string;
  min_bet: number;
  max_bet: number;
  max_paylines: number;
  launched_at: string;
}

type PlatformStatSummary = {
  contractId: number;
  totalAmountBet: number;
  totalAmountPaid: number;
  totalBets: number;
  totalWinningSpins: number;
  uniquePlayers: number;
  largestSingleWin: number;
};

type RecentWinnerEntry = {
  rank: number;
  identifier: string;
  display_name: string | null;
  profile_id: string | null;
  linked_addresses: string[] | null;
  total_won: string | number | null;
  net_result: string | number | null;
  total_spins: number | null;
  win_rate: number | null;
};

const formatMicroVoi = (microVoi: number) =>
  (microVoi / 1_000_000).toFixed(2);

function toNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'bigint') {
    return Number(value);
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

async function fetchSlotConfigs(): Promise<SlotConfig[]> {
  try {
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      }/api/games/slot-configs`,
      {
        next: { revalidate: 60 }, // Cache for 1 minute instead of no-store
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch slot configs:', response.statusText);
      return [];
    }

    const data = await response.json();
    return data.success ? (data.data as SlotConfig[]) : [];
  } catch (error) {
    console.error('Error fetching slot configs:', error);
    return [];
  }
}

async function fetchPlatformStatsSummary(
  contractId: number,
  timeframe: 'daily' | 'all-time'
): Promise<PlatformStatSummary | null> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const url = new URL('/api/statistics/platform', baseUrl);
    url.searchParams.set('contractId', String(contractId));
    url.searchParams.set('timeframe', timeframe);

    const response = await fetch(url.toString(), {
      next: { revalidate: 30 }, // Cache for 30 seconds instead of no-store
    });

    if (!response.ok) {
      console.error(
        `Failed to fetch ${timeframe} platform stats:`,
        response.statusText
      );
      return null;
    }

    const payload = await response.json();
    const row =
      Array.isArray(payload.data) && payload.data.length > 0
        ? payload.data[0]
        : null;

    if (!row) {
      return null;
    }

    return {
      contractId,
      totalAmountBet: toNumber(row.total_amount_bet),
      totalAmountPaid: toNumber(row.total_amount_paid),
      totalBets: toNumber(row.total_bets),
      totalWinningSpins: toNumber(row.total_winning_spins),
      uniquePlayers: toNumber(row.unique_players),
      largestSingleWin: toNumber(row.largest_single_win),
    };
  } catch (error) {
    console.error(`Error fetching ${timeframe} platform stats:`, error);
    return null;
  }
}

function aggregateStats(
  stats: PlatformStatSummary[]
): PlatformStatSummary | null {
  if (stats.length === 0) {
    return null;
  }

  return stats.reduce<PlatformStatSummary>(
    (acc, stat) => ({
      contractId: acc.contractId,
      totalAmountBet: acc.totalAmountBet + stat.totalAmountBet,
      totalAmountPaid: acc.totalAmountPaid + stat.totalAmountPaid,
      totalBets: acc.totalBets + stat.totalBets,
      totalWinningSpins: acc.totalWinningSpins + stat.totalWinningSpins,
      uniquePlayers: acc.uniquePlayers + stat.uniquePlayers,
      largestSingleWin: Math.max(acc.largestSingleWin, stat.largestSingleWin),
    }),
    {
      contractId: stats[0]?.contractId ?? 0,
      totalAmountBet: 0,
      totalAmountPaid: 0,
      totalBets: 0,
      totalWinningSpins: 0,
      uniquePlayers: 0,
      largestSingleWin: 0,
    }
  );
}

async function fetchRecentWinners(
  limit = 5,
  contractId?: number
): Promise<RecentWinnerEntry[]> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const url = new URL('/api/statistics/leaderboard', baseUrl);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('timeframe', 'daily');
    url.searchParams.set('rankBy', 'won');
    if (contractId !== undefined) {
      url.searchParams.set('contractId', String(contractId));
    }

    const response = await fetch(url.toString(), {
      next: { revalidate: 30 }, // Cache for 30 seconds instead of no-store
    });

    if (!response.ok) {
      console.error(
        'Failed to fetch recent winners:',
        response.statusText
      );
      return [];
    }

    const data = await response.json();
    return Array.isArray(data.data) ? (data.data as RecentWinnerEntry[]) : [];
  } catch (error) {
    console.error('Error fetching recent winners:', error);
    return [];
  }
}

async function fetchProfileStatsForSession(
  session: SessionInfo | null
): Promise<AggregatedProfileStatsPayload | null> {
  if (!session) {
    return null;
  }

  try {
    const profile = await getProfileWithAccounts(session.sub);
    if (!profile) {
      return null;
    }

    const addresses = [
      ...new Set(
        profile.accounts
          .map((account) => account.address?.trim().toLowerCase())
          .filter((address): address is string => Boolean(address))
      ),
    ];

    if (addresses.length === 0) {
      return null;
    }

    const aggregated = await getAggregatedProfileStatsSafe(addresses);
    return aggregated ? serializeAggregatedProfileStats(aggregated) : null;
  } catch (error) {
    console.error('Failed to fetch profile statistics:', error);
    return null;
  }
}

function resolveWinnerDisplayName(winner: RecentWinnerEntry): string {
  if (winner.display_name && winner.display_name.trim().length > 0) {
    return winner.display_name;
  }

  if (winner.linked_addresses && winner.linked_addresses.length > 0) {
    return truncateAddress(winner.linked_addresses[0]);
  }

  return truncateAddress(winner.identifier);
}

// Separate async component for platform stats
async function PlatformStats({ contractIds }: { contractIds: number[] }) {
  // Fetch daily stats in parallel
  const dailyStatsResults = await Promise.all(
    contractIds.map((contractId) =>
      fetchPlatformStatsSummary(contractId, 'daily')
    )
  );
  const dailyStats = dailyStatsResults.filter(
    (stat): stat is PlatformStatSummary => stat !== null
  );

  const aggregatedDailyStats = aggregateStats(dailyStats);

  let statsScope: 'Today' | 'All Time' = 'Today';
  let aggregatedStats = aggregatedDailyStats;

  if (!aggregatedStats && contractIds.length > 0) {
    const allTimeStatsResults = await Promise.all(
      contractIds.map((contractId) =>
        fetchPlatformStatsSummary(contractId, 'all-time')
      )
    );
    const allTimeStats = allTimeStatsResults.filter(
      (stat): stat is PlatformStatSummary => stat !== null
    );
    const aggregatedAllTime = aggregateStats(allTimeStats);

    if (aggregatedAllTime) {
      aggregatedStats = aggregatedAllTime;
      statsScope = 'All Time';
    }
  }

  const playedAmountDisplay = aggregatedStats
    ? formatCurrency(aggregatedStats.totalAmountBet)
    : '—';
  const topWinDisplay = aggregatedStats
    ? formatCurrency(aggregatedStats.largestSingleWin)
    : '—';
  const playersCountDisplay = aggregatedStats
    ? formatNumber(aggregatedStats.uniquePlayers)
    : '—';
  const winRateValue =
    aggregatedStats && aggregatedStats.totalBets > 0
      ? (aggregatedStats.totalWinningSpins / aggregatedStats.totalBets) *
        100
      : 0;
  const winRateDisplay = aggregatedStats
    ? formatPercent(winRateValue)
    : '—';

  const playedLabel =
    statsScope === 'Today' ? 'Played Today' : 'Played All Time';
  const topWinLabel =
    statsScope === 'Today' ? 'Top Win Today' : 'Top Win All Time';
  const playersLabel =
    statsScope === 'Today' ? 'Players Active Today' : 'Unique Players';
  const winRateLabel =
    statsScope === 'Today' ? 'Win Rate Today' : 'Win Rate All Time';

  return (
    <Card elevated>
      <CardContent className="p-8">
        <div className="grid md:grid-cols-4 gap-6 animate-in fade-in duration-500">
          <div className="text-center">
            <div className="text-3xl font-semibold text-neutral-950 dark:text-white mb-2">
              {playedAmountDisplay}
            </div>
            <div className="text-sm text-neutral-700 dark:text-neutral-300">
              {playedLabel}
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-semibold text-neutral-950 dark:text-white mb-2">
              {topWinDisplay}
            </div>
            <div className="text-sm text-neutral-700 dark:text-neutral-300">
              {topWinLabel}
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-semibold text-neutral-950 dark:text-white mb-2">
              {playersCountDisplay}
            </div>
            <div className="text-sm text-neutral-700 dark:text-neutral-300">
              {playersLabel}
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-semibold text-neutral-950 dark:text-white mb-2">
              {winRateDisplay}
            </div>
            <div className="text-sm text-neutral-700 dark:text-neutral-300">
              {winRateLabel}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Separate async component for games grid
async function GamesGrid({ canPlay }: { canPlay: boolean }) {
  const games = await fetchSlotConfigs();

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500 slide-in-from-bottom-4">
      {games.length === 0 ? (
        <Card className="md:col-span-2 lg:col-span-3">
          <CardContent className="p-12 text-center">
            <div className="text-neutral-500 dark:text-neutral-400">
              No games available at this time. Check back soon!
            </div>
          </CardContent>
        </Card>
      ) : (
        games.map((game, index) => {
          const payoutRate = parseFloat(game.rtp_target ?? '0');
          return (
            <Card
              key={game.id}
              hover
              elevated
              className="animate-in fade-in duration-500 slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-8 space-y-6">
                {/* Game Icon & Title */}
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="text-primary-500 dark:text-primary-400">
                      <SlotMachineIcon size={56} />
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-neutral-950 dark:text-white mb-2">
                      {game.display_name}
                    </h3>
                    <p className="text-neutral-700 dark:text-neutral-300 text-sm">
                      {game.description ||
                        'Experience the thrill of slot machine gaming'}
                    </p>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <ChainBadge chain={game.chain} />
                      {game.theme && (
                        <span className="px-2 py-1 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs rounded-full capitalize">
                          {game.theme}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Game Info */}
                <div className="space-y-2 text-sm border-y border-neutral-200 dark:border-neutral-700 py-4">
                  <div className="flex justify-between">
                    <span className="text-neutral-700 dark:text-neutral-300">
                      RTP:
                    </span>
                    <span className="text-neutral-950 dark:text-white font-medium">
                      {payoutRate.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-700 dark:text-neutral-300">
                      Bet Range:
                    </span>
                    <span className="text-neutral-950 dark:text-white font-medium">
                      {formatMicroVoi(game.min_bet)} -{' '}
                      {formatMicroVoi(game.max_bet)} VOI
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-700 dark:text-neutral-300">
                      Max Paylines:
                    </span>
                    <span className="text-neutral-950 dark:text-white font-medium">
                      {game.max_paylines}
                    </span>
                  </div>
                </div>

                {/* Play Button */}
                {canPlay ? (
                  <a
                    href={`/games/slots?contract=${game.contract_id}`}
                    className="block"
                  >
                    <Button variant="primary" size="md" className="w-full">
                      Play Now
                    </Button>
                  </a>
                ) : (
                  <a href="/auth" className="block">
                    <Button variant="primary" size="md" className="w-full">
                      Sign In to Play
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}

// Separate async component for player stats
async function PlayerStats({ session, defaultContractId }: { session: SessionInfo; defaultContractId: number }) {
  const [recentWinners, profileStats] = await Promise.all([
    fetchRecentWinners(5, defaultContractId),
    fetchProfileStatsForSession(session),
  ]);

  const totalPlayedDisplay = profileStats
    ? `${formatVoi(profileStats.total_bet)} VOI`
    : '0.00 VOI';
  const netResultMicro = profileStats ? BigInt(profileStats.net_result) : 0n;
  const netResultFormatted = profileStats
    ? formatVoi(profileStats.net_result)
    : '0.00';
  const earningsDisplay =
    profileStats && netResultMicro > 0n
      ? `+${netResultFormatted} VOI`
      : `${netResultFormatted} VOI`;
  const earningsClass =
    netResultMicro >= 0n
      ? 'text-success-600 dark:text-success-400'
      : 'text-error-600 dark:text-error-400';
  const sessionsDisplay = formatNumber(profileStats?.total_spins ?? 0);

  return (
    <div className="grid md:grid-cols-2 gap-6 animate-in fade-in duration-500 slide-in-from-bottom-4">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-neutral-950 dark:text-white flex items-center gap-2">
            <TrendingUpIcon size={20} />
            Your Activity
          </h3>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
            <span className="text-neutral-700 dark:text-neutral-300">
              Total Played
            </span>
            <span className="text-neutral-950 dark:text-white font-semibold">
              {totalPlayedDisplay}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
            <span className="text-neutral-700 dark:text-neutral-300">
              Total Earnings
            </span>
            <span className={`${earningsClass} font-semibold`}>
              {earningsDisplay}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-neutral-700 dark:text-neutral-300">
              Sessions
            </span>
            <span className="text-neutral-950 dark:text-white font-semibold">
              {sessionsDisplay}
            </span>
          </div>
          <a href="/games/history" className="block pt-2">
            <Button variant="outline" size="sm" className="w-full">
              View History
            </Button>
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-neutral-950 dark:text-white">
            Recent Winners
          </h3>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentWinners.length === 0 ? (
            <div className="text-neutral-500 dark:text-neutral-400 text-sm text-center py-6">
              No recent wins yet. Be the first!
            </div>
          ) : (
            <div className="space-y-4">
              {recentWinners.map((winner) => {
                const name = resolveWinnerDisplayName(winner);
                const totalWonFormatted = formatVoi(
                  winner.total_won ?? '0'
                );
                const winnerNetResultMicro = BigInt(
                  winner.net_result ?? '0'
                );
                const winnerNetResultFormatted = formatVoi(
                  winner.net_result ?? '0'
                );
                const winnerNetResultDisplay =
                  winnerNetResultMicro > 0n
                    ? `+${winnerNetResultFormatted} VOI`
                    : `${winnerNetResultFormatted} VOI`;
                const winnerNetResultClass =
                  winnerNetResultMicro >= 0n
                    ? 'text-success-600 dark:text-success-400'
                    : 'text-error-600 dark:text-error-400';

                const winRate = winner.win_rate ?? 0;

                return (
                  <div
                    key={`winner-${winner.profile_id ?? winner.identifier}-${winner.rank}`}
                    className="flex justify-between items-start gap-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-neutral-950 dark:text-white">
                        {name}
                      </p>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        Won {totalWonFormatted} VOI •{' '}
                        {formatNumber(winner.total_spins ?? 0)} spins
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-semibold ${winnerNetResultClass}`}
                      >
                        {winnerNetResultDisplay}
                      </p>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        {formatPercent(winRate)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default async function GamesLobby() {
  const session = await getServerSessionFromRequest();
  const canPlay = Boolean(session?.gameAccessGranted);

  // Get contract IDs for stats (fast, in-memory operation)
  const games = await fetchSlotConfigs();
  const contractIds = [
    ...new Set(
      games
        .map((game) => Number(game.contract_id))
        .filter((id) => Number.isFinite(id) && id > 0)
    ),
  ];
  const defaultContractId = contractIds[0];

  return (
    <div className="space-y-8">
      {/* Header - Renders immediately */}
      <div className="text-center space-y-3 animate-in fade-in duration-300">
        <h1 className="text-4xl md:text-5xl font-semibold text-neutral-950 dark:text-white">
          Browse Games
        </h1>
        <p className="text-neutral-700 dark:text-neutral-300 text-lg">
          Pick your favorite and start playing
        </p>
      </div>

      {/* Featured Stats - Streams in after fetch completes */}
      <Suspense fallback={<PlatformStatsSkeleton />}>
        <PlatformStats contractIds={contractIds} />
      </Suspense>

      {/* Games Grid - Streams in independently */}
      <Suspense fallback={<GamesGridSkeleton />}>
        <GamesGrid canPlay={canPlay} />
      </Suspense>

      {/* Player Stats - Only for authenticated users, streams in last */}
      {canPlay && session && defaultContractId && (
        <Suspense fallback={
          <div className="grid md:grid-cols-2 gap-6">
            <ProfileStatsSkeleton />
            <WinnersTableSkeleton />
          </div>
        }>
          <PlayerStats session={session} defaultContractId={defaultContractId} />
        </Suspense>
      )}
    </div>
  );
}
