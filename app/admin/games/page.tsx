'use client';
import { useState } from 'react';
import Card, { CardContent, CardHeader } from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { SlotMachineIcon, DiceIcon, CardSuitIcon, CheckCircleIcon } from '@/components/icons';

// Mock game data
const mockGames = [
  {
    id: '1',
    type: 'slots',
    name: '5-Reel Slots',
    description: 'Classic 5-reel slot machine with massive jackpots',
    houseEdge: 2.0,
    minBet: 0.01,
    maxBet: 100,
    rtp: 98.0,
    active: true,
    totalWagered: 145000,
    totalPayout: 142100,
    totalRounds: 12340,
  },
  {
    id: '2',
    type: 'dice',
    name: 'Dice Roll',
    description: 'Predict the dice roll outcome',
    houseEdge: 1.5,
    minBet: 0.001,
    maxBet: 50,
    rtp: 98.5,
    active: true,
    totalWagered: 98000,
    totalPayout: 96530,
    totalRounds: 8934,
  },
  {
    id: '3',
    type: 'cards',
    name: 'Blackjack',
    description: 'Classic 21 card game',
    houseEdge: 1.0,
    minBet: 0.01,
    maxBet: 200,
    rtp: 99.0,
    active: false,
    totalWagered: 0,
    totalPayout: 0,
    totalRounds: 0,
  },
];

export default function AdminGames() {
  const [games, setGames] = useState(mockGames);
  const [editingGame, setEditingGame] = useState<typeof mockGames[0] | null>(null);

  const getGameIcon = (type: string) => {
    switch (type) {
      case 'slots': return SlotMachineIcon;
      case 'dice': return DiceIcon;
      case 'cards': return CardSuitIcon;
      default: return SlotMachineIcon;
    }
  };

  const toggleGameStatus = (gameId: string) => {
    setGames(prev => prev.map(game =>
      game.id === gameId ? { ...game, active: !game.active } : game
    ));
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-gold-400 neon-text uppercase">Game Management</h1>
          <p className="text-neutral-400 mt-2">
            Configure and monitor all casino games
          </p>
        </div>
        <a href="/admin">
          <Button variant="ghost" size="sm">
            ← Back to Dashboard
          </Button>
        </a>
      </div>

      {/* Games List */}
      <div className="space-y-6">
        {games.map((game) => {
          const GameIcon = getGameIcon(game.type);
          const profit = game.totalWagered - game.totalPayout;
          const actualEdge = game.totalWagered > 0
            ? ((profit / game.totalWagered) * 100).toFixed(2)
            : '0.00';

          return (
            <Card key={game.id} glow={game.active}>
              <CardContent className="p-8">
                <div className="grid lg:grid-cols-12 gap-6">
                  {/* Game Info */}
                  <div className="lg:col-span-4 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="text-gold-400">
                        <GameIcon size={48} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-2xl font-black text-gold-400 uppercase">
                            {game.name}
                          </h3>
                          {game.active ? (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30 font-bold uppercase">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-neutral-700 text-neutral-400 text-xs rounded-full border border-neutral-600 font-bold uppercase">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-neutral-400 text-sm mt-1">
                          {game.description}
                        </p>
                      </div>
                    </div>

                    {/* Configuration */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-2 border-b border-gold-900/20">
                        <span className="text-neutral-500">House Edge:</span>
                        <span className="text-neutral-300 font-semibold">{game.houseEdge}%</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gold-900/20">
                        <span className="text-neutral-500">RTP:</span>
                        <span className="text-neutral-300 font-semibold">{game.rtp}%</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gold-900/20">
                        <span className="text-neutral-500">Min/Max Bet:</span>
                        <span className="text-neutral-300 font-semibold">
                          ${game.minBet} - ${game.maxBet}
                        </span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-neutral-500">Total Rounds:</span>
                        <span className="text-neutral-300 font-semibold">
                          {game.totalRounds.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border border-gold-900/20">
                      <div className="text-xs text-neutral-500 uppercase tracking-wider font-bold mb-2">
                        Total Wagered
                      </div>
                      <div className="text-2xl font-black text-gold-400">
                        ${game.totalWagered.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border border-gold-900/20">
                      <div className="text-xs text-neutral-500 uppercase tracking-wider font-bold mb-2">
                        Total Payout
                      </div>
                      <div className="text-2xl font-black text-gold-400">
                        ${game.totalPayout.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border border-green-900/20 bg-green-500/5">
                      <div className="text-xs text-neutral-500 uppercase tracking-wider font-bold mb-2">
                        House Profit
                      </div>
                      <div className="text-2xl font-black text-green-400">
                        ${profit.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border border-gold-900/20">
                      <div className="text-xs text-neutral-500 uppercase tracking-wider font-bold mb-2">
                        Actual Edge
                      </div>
                      <div className="text-2xl font-black text-gold-400">
                        {actualEdge}%
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">
                        Target: {game.houseEdge}%
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="lg:col-span-3 flex flex-col gap-3">
                    <Button
                      variant={game.active ? 'outline' : 'primary'}
                      size="md"
                      onClick={() => toggleGameStatus(game.id)}
                      className="w-full"
                    >
                      {game.active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="md"
                      onClick={() => setEditingGame(game)}
                      className="w-full"
                    >
                      Edit Configuration
                    </Button>
                    <button className="px-4 py-2 text-sm border border-gold-500/30 text-gold-400 rounded-xl hover:bg-gold-500/10 transition-colors font-bold uppercase tracking-wide">
                      View Details
                    </button>
                    {!game.active && game.totalRounds === 0 && (
                      <button className="px-4 py-2 text-sm border border-ruby-500/30 text-ruby-400 rounded-xl hover:bg-ruby-500/10 transition-colors font-bold uppercase tracking-wide">
                        Delete Game
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add New Game */}
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-gold-400 uppercase">Add New Game</h2>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Button variant="primary" size="lg">
              + Create New Game
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Game Modal (Simplified) */}
      {editingGame && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gold-400 uppercase">
                  Edit {editingGame.name}
                </h2>
                <button
                  onClick={() => setEditingGame(null)}
                  className="text-neutral-400 hover:text-gold-400 text-2xl"
                >
                  ×
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="House Edge (%)"
                  type="number"
                  defaultValue={editingGame.houseEdge}
                  step="0.1"
                />
                <Input
                  label="RTP (%)"
                  type="number"
                  defaultValue={editingGame.rtp}
                  step="0.1"
                />
                <Input
                  label="Min Bet ($)"
                  type="number"
                  defaultValue={editingGame.minBet}
                  step="0.001"
                />
                <Input
                  label="Max Bet ($)"
                  type="number"
                  defaultValue={editingGame.maxBet}
                  step="1"
                />
              </div>

              <div>
                <Input
                  label="Description"
                  defaultValue={editingGame.description}
                />
              </div>

              <div className="flex gap-3">
                <Button variant="primary" size="md" onClick={() => setEditingGame(null)}>
                  Save Changes
                </Button>
                <Button variant="ghost" size="md" onClick={() => setEditingGame(null)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
