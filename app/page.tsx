import Button from '@/components/Button';
import { SlotMachineIcon, DiceIcon, CardSuitIcon, BoltIcon, LockIcon, GlobeIcon, CoinsIcon } from '@/components/icons';

export default function Page() {
  return (
    <div className="space-y-32">
      {/* Hero Section */}
      <section className="pt-20 pb-32 text-center relative overflow-hidden">
        <div className="max-w-5xl mx-auto space-y-12 relative z-10">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-gold-500/20 bg-gold-500/5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-500"></span>
            </span>
            <span className="text-xs font-bold text-gold-400 tracking-widest uppercase">Live on Chain</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black leading-none">
            <div className="text-white mb-4">HOUSE OF VOI</div>
          </h1>

          <p className="text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Multi-chain gaming platform powered by blockchain.
            Provably fair. Instant payouts. Your wallet, your winnings.
          </p>

          <div className="flex gap-4 justify-center flex-wrap pt-8">
            <Button variant="primary" size="lg">
              <a href="/auth">Start Playing</a>
            </Button>
            <Button variant="ghost" size="lg">
              <a href="/app">Explore Games</a>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto pt-16">
            <div className="casino-card p-6">
              <div className="text-4xl font-black text-gold-400 mb-2">$2.5M</div>
              <div className="text-xs text-neutral-500 uppercase tracking-wider font-bold">Wagered</div>
            </div>
            <div className="casino-card p-6">
              <div className="text-4xl font-black text-gold-400 mb-2">10K+</div>
              <div className="text-xs text-neutral-500 uppercase tracking-wider font-bold">Players</div>
            </div>
            <div className="casino-card p-6">
              <div className="text-4xl font-black text-gold-400 mb-2">99.2%</div>
              <div className="text-xs text-neutral-500 uppercase tracking-wider font-bold">Payout</div>
            </div>
          </div>
        </div>
      </section>

      {/* Games Section */}
      <section className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-black text-white mb-4 tracking-tight">
            FEATURED GAMES
          </h2>
          <p className="text-xl text-neutral-400 font-medium">
            Provably fair blockchain gaming
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="casino-card-glow p-8 group cursor-pointer hover:-translate-y-2 transition-all">
            <div className="text-gold-400 mb-6 group-hover:scale-110 transition-transform flex justify-center">
              <SlotMachineIcon size={64} />
            </div>
            <h3 className="text-2xl font-black text-gold-400 mb-3 uppercase">
              Slot Machines
            </h3>
            <p className="text-neutral-400 leading-relaxed mb-6">
              5-reel slots with massive jackpots. Spin to win on Base, Voi, and Solana.
            </p>
            <div className="text-sm font-bold text-royal-400 uppercase tracking-wider">
              Play Now →
            </div>
          </div>

          <div className="casino-card-glow p-8 group cursor-pointer hover:-translate-y-2 transition-all">
            <div className="text-gold-400 mb-6 group-hover:scale-110 transition-transform flex justify-center">
              <DiceIcon size={64} />
            </div>
            <h3 className="text-2xl font-black text-gold-400 mb-3 uppercase">
              Dice Games
            </h3>
            <p className="text-neutral-400 leading-relaxed mb-6">
              Classic dice with crypto. Fast, fair, and transparent blockchain rolls.
            </p>
            <div className="text-sm font-bold text-royal-400 uppercase tracking-wider">
              Play Now →
            </div>
          </div>

          <div className="casino-card-glow p-8 group cursor-pointer hover:-translate-y-2 transition-all">
            <div className="text-gold-400 mb-6 group-hover:scale-110 transition-transform flex justify-center">
              <CardSuitIcon size={64} />
            </div>
            <h3 className="text-2xl font-black text-gold-400 mb-3 uppercase">
              Card Games
            </h3>
            <p className="text-neutral-400 leading-relaxed mb-6">
              Blackjack, poker, and more. Test your skills against the house.
            </p>
            <div className="text-sm font-bold text-royal-400 uppercase tracking-wider">
              Play Now →
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="max-w-4xl mx-auto">
        <div className="casino-card p-12 chip-pattern">
          <h2 className="text-4xl font-black text-center text-gold-400 mb-12 uppercase neon-text">
            Why House of Voi?
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="text-gold-400">
                <BoltIcon size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Instant Payouts</h3>
                <p className="text-neutral-400">
                  Win and withdraw instantly. No delays, no waiting periods.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-gold-400">
                <LockIcon size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Provably Fair</h3>
                <p className="text-neutral-400">
                  Every game is verifiable on-chain. No hidden algorithms.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-gold-400">
                <GlobeIcon size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Multi-Chain</h3>
                <p className="text-neutral-400">
                  Play with Base, Voi, or Solana. Your choice, your chain.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-gold-400">
                <CoinsIcon size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Referral Rewards</h3>
                <p className="text-neutral-400">
                  Invite friends and earn commission on their wagers. Forever.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-5xl mx-auto">
        <div className="casino-card-glow p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gold-500/10 to-royal-500/10"></div>
          <div className="relative z-10">
            <h2 className="text-5xl font-black text-gold-400 mb-6 neon-text uppercase">
              Ready to Roll?
            </h2>
            <p className="text-xl text-neutral-300 mb-10 max-w-2xl mx-auto font-medium">
              Connect your wallet and start playing. No sign-up, no KYC. Just pure gaming.
            </p>
            <Button variant="primary" size="lg">
              <a href="/auth" className="flex items-center gap-3 text-lg">
                <SlotMachineIcon size={24} />
                Connect Wallet & Play
              </a>
            </Button>
            <p className="text-sm text-neutral-500 mt-6 font-medium">
              18+ only. Play responsibly.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
