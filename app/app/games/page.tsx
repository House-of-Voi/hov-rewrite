import Card, { CardContent, CardHeader } from '@/components/Card';
import Button from '@/components/Button';
import { SlotMachineIcon, TrendingUpIcon } from '@/components/icons';
import ChainBadge from '@/components/ChainBadge';
import { getServerSessionFromRequest, hasGameAccess } from '@/lib/auth/session';

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

async function fetchSlotConfigs(): Promise<SlotConfig[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/games/slot-configs`, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      console.error('Failed to fetch slot configs:', response.statusText);
      return [];
    }

    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error fetching slot configs:', error);
    return [];
  }
}

const formatMicroVoi = (microVoi: number) => {
  return (microVoi / 1000000).toFixed(2);
};

export default async function GamesLobby() {
  // Check if user is authenticated and has game access
  const session = await getServerSessionFromRequest();
  const canPlay = session ? await hasGameAccess() : false;

  const games = await fetchSlotConfigs();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl md:text-5xl font-semibold text-neutral-950 dark:text-white">Browse Games</h1>
        <p className="text-neutral-700 dark:text-neutral-300 text-lg">
          Pick your favorite and start playing
        </p>
      </div>

      {/* Featured Stats */}
      <Card elevated>
        <CardContent className="p-8">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-semibold text-neutral-950 dark:text-white mb-2">$243K</div>
              <div className="text-sm text-neutral-700 dark:text-neutral-300">
                Played Today
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-semibold text-neutral-950 dark:text-white mb-2">$5.4K</div>
              <div className="text-sm text-neutral-700 dark:text-neutral-300">
                Top Win Today
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-semibold text-neutral-950 dark:text-white mb-2">390</div>
              <div className="text-sm text-neutral-700 dark:text-neutral-300">
                Players Online
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-semibold text-neutral-950 dark:text-white mb-2">98.5%</div>
              <div className="text-sm text-neutral-700 dark:text-neutral-300">
                Win Rate
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Games Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="p-12 text-center">
              <div className="text-neutral-500 dark:text-neutral-400">
                No games available at this time. Check back soon!
              </div>
            </CardContent>
          </Card>
        ) : (
          games.map((game) => {
            const payoutRate = parseFloat(game.rtp_target);
            return (
              <Card key={game.id} hover elevated>
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
                        {game.description || 'Experience the thrill of slot machine gaming'}
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
                      <span className="text-neutral-700 dark:text-neutral-300">RTP:</span>
                      <span className="text-neutral-950 dark:text-white font-medium">{payoutRate.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-700 dark:text-neutral-300">Bet Range:</span>
                      <span className="text-neutral-950 dark:text-white font-medium">
                        {formatMicroVoi(game.min_bet)} - {formatMicroVoi(game.max_bet)} VOI
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-700 dark:text-neutral-300">Max Paylines:</span>
                      <span className="text-neutral-950 dark:text-white font-medium">
                        {game.max_paylines}
                      </span>
                    </div>
                  </div>

                  {/* Play Button */}
                  {canPlay ? (
                    <a href={`/app/games/slots?contract=${game.contract_id}`} className="block">
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

      {/* Player Stats - Only show for authenticated users with game access */}
      {canPlay && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-neutral-950 dark:text-white flex items-center gap-2">
                <TrendingUpIcon size={20} />
                Your Activity
              </h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
                <span className="text-neutral-700 dark:text-neutral-300">Total Played</span>
                <span className="text-neutral-950 dark:text-white font-semibold">$0.00</span>
              </div>
              <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
                <span className="text-neutral-700 dark:text-neutral-300">Total Earnings</span>
                <span className="text-success-600 dark:text-success-400 font-semibold">$0.00</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-neutral-700 dark:text-neutral-300">Sessions</span>
                <span className="text-neutral-950 dark:text-white font-semibold">0</span>
              </div>
              <a href="/app/games/history" className="block pt-2">
                <Button variant="outline" size="sm" className="w-full">
                  View History
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-neutral-950 dark:text-white">Recent Winners</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-neutral-500 dark:text-neutral-400 text-sm text-center py-6">
                No recent wins yet. Be the first!
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
