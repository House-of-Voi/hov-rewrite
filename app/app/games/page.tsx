import Card, { CardContent, CardHeader } from '@/components/Card';
import Button from '@/components/Button';
import { SlotMachineIcon, DiceIcon, CardSuitIcon, TrendingUpIcon } from '@/components/icons';
import { getServerSessionFromRequest } from '@/lib/auth/session';
import { DEMO_MODE } from '@/lib/utils/env';

// Mock game data - will be replaced with database queries
const games = [
  {
    id: '1',
    type: 'slots',
    name: '5-Reel Slots',
    description: 'Classic 5-reel slot machine with massive jackpots',
    houseEdge: 2.0,
    minBet: 0.01,
    maxBet: 100,
    icon: SlotMachineIcon,
    active: true,
    stats: {
      totalWagered: 145000,
      biggestWin: 5420,
      activePlayers: 234,
    }
  },
  {
    id: '2',
    type: 'dice',
    name: 'Dice Roll',
    description: 'Predict the dice roll outcome',
    houseEdge: 1.5,
    minBet: 0.001,
    maxBet: 50,
    icon: DiceIcon,
    active: true,
    stats: {
      totalWagered: 98000,
      biggestWin: 2100,
      activePlayers: 156,
    }
  },
  {
    id: '3',
    type: 'cards',
    name: 'Blackjack',
    description: 'Classic 21 card game',
    houseEdge: 1.0,
    minBet: 0.01,
    maxBet: 200,
    icon: CardSuitIcon,
    active: false, // Coming soon
    stats: {
      totalWagered: 0,
      biggestWin: 0,
      activePlayers: 0,
    }
  },
];

export default async function GamesLobby() {
  const session = await getServerSessionFromRequest();

  if (!session && !DEMO_MODE) {
    return (
      <div className="text-center py-12 space-y-4">
        <h1 className="text-2xl font-bold text-gold-400">Authentication Required</h1>
        <p className="text-neutral-400">
          Please <a href="/auth" className="text-gold-400 hover:text-gold-300 underline">sign in</a> to play games.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-5xl font-black text-gold-400 neon-text uppercase">Game Lobby</h1>
        <p className="text-neutral-400 text-lg">
          Choose your game. Provably fair. Instant payouts.
        </p>
      </div>

      {/* Featured Stats */}
      <Card glow>
        <CardContent className="p-8">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl font-black text-gold-400 mb-2">$243K</div>
              <div className="text-sm text-neutral-500 uppercase tracking-wider font-bold">
                Total Wagered Today
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-gold-400 mb-2">$5.4K</div>
              <div className="text-sm text-neutral-500 uppercase tracking-wider font-bold">
                Biggest Win Today
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-gold-400 mb-2">390</div>
              <div className="text-sm text-neutral-500 uppercase tracking-wider font-bold">
                Active Players
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-gold-400 mb-2">98.5%</div>
              <div className="text-sm text-neutral-500 uppercase tracking-wider font-bold">
                Average RTP
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Games Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => {
          const IconComponent = game.icon;
          return (
            <Card key={game.id} hover glow={game.active}>
              <CardContent className="p-8 space-y-6">
                {/* Game Icon & Title */}
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="text-gold-400">
                      <IconComponent size={64} />
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-black text-gold-400 uppercase mb-2">
                      {game.name}
                    </h3>
                    <p className="text-neutral-400 text-sm">
                      {game.description}
                    </p>
                  </div>
                </div>

                {/* Game Stats */}
                {game.active && (
                  <div className="grid grid-cols-3 gap-3 py-4 border-y border-gold-900/20">
                    <div className="text-center">
                      <div className="text-sm text-neutral-500 mb-1">Wagered</div>
                      <div className="text-gold-400 font-bold">
                        ${(game.stats.totalWagered / 1000).toFixed(0)}K
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-neutral-500 mb-1">Big Win</div>
                      <div className="text-gold-400 font-bold">
                        ${game.stats.biggestWin}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-neutral-500 mb-1">Players</div>
                      <div className="text-gold-400 font-bold">
                        {game.stats.activePlayers}
                      </div>
                    </div>
                  </div>
                )}

                {/* Game Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">House Edge:</span>
                    <span className="text-neutral-300 font-semibold">{game.houseEdge}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Min/Max Bet:</span>
                    <span className="text-neutral-300 font-semibold">
                      ${game.minBet} - ${game.maxBet}
                    </span>
                  </div>
                </div>

                {/* Play Button */}
                {game.active ? (
                  <a href={`/app/games/${game.type}`} className="block">
                    <Button variant="primary" size="md" className="w-full">
                      Play Now
                    </Button>
                  </a>
                ) : (
                  <Button variant="ghost" size="md" className="w-full" disabled>
                    Coming Soon
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Player Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-xl font-bold text-gold-400 uppercase flex items-center gap-2">
              <TrendingUpIcon size={24} />
              Your Stats
            </h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gold-900/20">
              <span className="text-neutral-400">Total Wagered</span>
              <span className="text-gold-400 font-bold">$0.00</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gold-900/20">
              <span className="text-neutral-400">Total Won</span>
              <span className="text-green-400 font-bold">$0.00</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-neutral-400">Games Played</span>
              <span className="text-neutral-300 font-bold">0</span>
            </div>
            <a href="/app/games/history" className="block pt-2">
              <Button variant="ghost" size="sm" className="w-full">
                View History
              </Button>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-xl font-bold text-gold-400 uppercase">Recent Winners</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-neutral-500 text-sm text-center py-6">
              No recent wins to display
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
