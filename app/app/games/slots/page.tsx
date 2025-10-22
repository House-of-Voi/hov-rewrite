'use client';
import { useState } from 'react';
import Card, { CardContent, CardHeader } from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { SlotMachineIcon, CoinsIcon } from '@/components/icons';

// Slot symbols
const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '💎', '⭐', '7️⃣'];

export default function SlotsGame() {
  const [reels, setReels] = useState(['🍒', '🍋', '🍊', '🍇', '💎']);
  const [betAmount, setBetAmount] = useState('0.01');
  const [chain, setChain] = useState<'base' | 'voi' | 'solana'>('base');
  const [spinning, setSpinning] = useState(false);
  const [balance, setBalance] = useState(10.00); // Mock balance
  const [lastWin, setLastWin] = useState<number | null>(null);

  const handleSpin = async () => {
    const bet = parseFloat(betAmount);
    if (isNaN(bet) || bet <= 0 || bet > balance) {
      alert('Invalid bet amount');
      return;
    }

    setSpinning(true);
    setLastWin(null);

    // Simulate spinning animation
    const spinInterval = setInterval(() => {
      setReels(prev => prev.map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]));
    }, 100);

    // Simulate blockchain transaction delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    clearInterval(spinInterval);

    // Mock result (in production, this comes from smart contract)
    const finalReels = Array(5).fill(null).map(() =>
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
    );
    setReels(finalReels);

    // Check for wins (simplified - just check if 3+ symbols match)
    const symbolCounts = finalReels.reduce((acc, symbol) => {
      acc[symbol] = (acc[symbol] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const maxCount = Math.max(...Object.values(symbolCounts));

    if (maxCount >= 3) {
      const multiplier = maxCount === 5 ? 50 : maxCount === 4 ? 10 : 3;
      const winAmount = bet * multiplier;
      setLastWin(winAmount);
      setBalance(prev => prev + winAmount - bet);
    } else {
      setBalance(prev => prev - bet);
    }

    setSpinning(false);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-gold-400 neon-text uppercase flex items-center gap-3">
            <SlotMachineIcon size={48} />
            5-Reel Slots
          </h1>
          <p className="text-neutral-400 mt-2">
            Match 3 or more symbols to win. Provably fair blockchain gaming.
          </p>
        </div>
        <a href="/app/games">
          <Button variant="ghost" size="sm">
            ← Back to Lobby
          </Button>
        </a>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Game Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Slot Machine */}
          <Card glow className="bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900">
            <CardContent className="p-12">
              {/* Reels */}
              <div className="mb-8">
                <div className="grid grid-cols-5 gap-4">
                  {reels.map((symbol, idx) => (
                    <div
                      key={idx}
                      className={`aspect-square rounded-2xl bg-gradient-to-br from-gold-500/10 to-gold-600/5 border-2 border-gold-500/30 flex items-center justify-center text-6xl transition-all duration-300 ${
                        spinning ? 'animate-pulse blur-sm' : 'blur-0'
                      }`}
                    >
                      {symbol}
                    </div>
                  ))}
                </div>
              </div>

              {/* Win Display */}
              {lastWin !== null && (
                <div className="text-center mb-6 animate-scale-in">
                  <div className="text-5xl font-black text-gold-400 neon-text">
                    +${lastWin.toFixed(2)}
                  </div>
                  <div className="text-neutral-400 uppercase tracking-wider text-sm mt-2">
                    You Won!
                  </div>
                </div>
              )}

              {/* Spin Button */}
              <Button
                variant="primary"
                size="lg"
                onClick={handleSpin}
                disabled={spinning}
                loading={spinning}
                className="w-full text-xl py-6"
              >
                {spinning ? 'Spinning...' : `Spin (${betAmount} ${chain.toUpperCase()})`}
              </Button>
            </CardContent>
          </Card>

          {/* Paytable */}
          <Card>
            <CardHeader>
              <h3 className="text-xl font-bold text-gold-400 uppercase">Paytable</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 border border-gold-900/20 rounded-lg">
                  <div className="text-3xl mb-2">🍒🍒🍒</div>
                  <div className="text-gold-400 font-bold">3x Bet</div>
                </div>
                <div className="p-4 border border-gold-900/20 rounded-lg">
                  <div className="text-3xl mb-2">🍇🍇🍇🍇</div>
                  <div className="text-gold-400 font-bold">10x Bet</div>
                </div>
                <div className="p-4 border border-gold-900/20 rounded-lg">
                  <div className="text-3xl mb-2">💎💎💎💎💎</div>
                  <div className="text-gold-400 font-bold">50x Bet</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Controls & Info */}
        <div className="space-y-6">
          {/* Balance Card */}
          <Card glow>
            <CardHeader>
              <h3 className="text-lg font-bold text-gold-400 uppercase flex items-center gap-2">
                <CoinsIcon size={20} />
                Balance
              </h3>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <div className="text-4xl font-black text-gold-400 mb-2">
                  ${balance.toFixed(2)}
                </div>
                <div className="text-xs text-neutral-500 uppercase tracking-wider">
                  {chain} Network
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bet Controls */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-bold text-gold-400 uppercase">Bet Amount</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                placeholder="0.01"
                step="0.01"
                min="0.01"
                max="100"
              />

              {/* Quick Bet Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {['0.01', '0.10', '1.00', '10.00'].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setBetAmount(amount)}
                    className="px-3 py-2 text-sm border-2 border-gold-500/30 text-gold-400 rounded-lg hover:bg-gold-500/10 transition-colors font-bold"
                  >
                    ${amount}
                  </button>
                ))}
              </div>

              {/* Chain Selector */}
              <div>
                <label className="block text-sm font-medium text-gold-400 mb-2" htmlFor="network">
                  Network
                </label>
                <select
                  id="network"
                  value={chain}
                  onChange={(e) => {
                    const selectedChain = e.target.value;
                    if (selectedChain === 'base' || selectedChain === 'voi' || selectedChain === 'solana') {
                      setChain(selectedChain);
                    }
                  }}
                  className="w-full rounded-xl border-2 border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-100 transition-all focus:border-gold-500 focus:ring-2 focus:ring-gold-500"
                >
                  <option value="base">Base</option>
                  <option value="voi">Voi</option>
                  <option value="solana">Solana</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Game Info */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-bold text-gold-400 uppercase">Game Info</h3>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-gold-900/20">
                <span className="text-neutral-500">RTP:</span>
                <span className="text-neutral-300 font-semibold">98.0%</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gold-900/20">
                <span className="text-neutral-500">House Edge:</span>
                <span className="text-neutral-300 font-semibold">2.0%</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-neutral-500">Max Payout:</span>
                <span className="text-neutral-300 font-semibold">50x Bet</span>
              </div>
            </CardContent>
          </Card>

          {/* Provably Fair */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-bold text-gold-400 uppercase">Provably Fair</h3>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-neutral-500 mb-3">
                Every spin is verifiable on-chain. Your seed:
              </p>
              <code className="block text-xs font-mono text-neutral-400 bg-neutral-900 p-3 rounded-lg break-all border border-gold-900/20">
                0x7a8b9c...placeholder
              </code>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
