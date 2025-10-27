import Button from '@/components/Button';
import { SlotMachineIcon, DiceIcon, CardSuitIcon, BoltIcon, LockIcon, GlobeIcon, CoinsIcon } from '@/components/icons';

export default function Page() {
  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="pt-12 pb-24 text-center relative overflow-hidden">
        <div className="max-w-5xl mx-auto space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-950 border border-primary-200 dark:border-primary-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-600"></span>
            </span>
            <span className="text-xs font-medium text-primary-700 dark:text-primary-300">Now Live</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-semibold leading-tight">
            <div className="text-neutral-950 dark:text-white mb-3">Fun Games,</div>
            <div className="text-gradient">Real Rewards</div>
          </h1>

          <p className="text-lg text-neutral-700 dark:text-neutral-300 max-w-2xl mx-auto leading-relaxed">
            Play engaging games and earn rewards on the blockchain.
            Transparent, fast, and built for everyone.
          </p>

          <div className="flex gap-4 justify-center flex-wrap pt-6">
            <Button variant="primary" size="lg">
              <a href="/auth">Get Started</a>
            </Button>
            <Button variant="outline" size="lg">
              <a href="/app/games">Browse Games</a>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto pt-12">
            <div className="card p-6">
              <div className="text-3xl font-semibold text-neutral-950 dark:text-white mb-2">$2.5M</div>
              <div className="text-sm text-neutral-700 dark:text-neutral-300">Total Played</div>
            </div>
            <div className="card p-6">
              <div className="text-3xl font-semibold text-neutral-950 dark:text-white mb-2">10K+</div>
              <div className="text-sm text-neutral-700 dark:text-neutral-300">Happy Players</div>
            </div>
            <div className="card p-6">
              <div className="text-3xl font-semibold text-neutral-950 dark:text-white mb-2">99.2%</div>
              <div className="text-sm text-neutral-700 dark:text-neutral-300">Win Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Games Section */}
      <section className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-semibold text-neutral-950 dark:text-white mb-4">
            Featured Games
          </h2>
          <p className="text-lg text-neutral-700 dark:text-neutral-300">
            Choose your favorite and start playing
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="card-interactive p-8 group cursor-pointer">
            <div className="text-primary-500 dark:text-primary-400 mb-6 group-hover:scale-105 transition-transform flex justify-center">
              <SlotMachineIcon size={56} />
            </div>
            <h3 className="text-xl font-semibold text-neutral-950 dark:text-white mb-3">
              Slot Machines
            </h3>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-6">
              Spin the reels and watch the rewards roll in. Available on Base, Voi, and Solana.
            </p>
            <div className="text-sm font-medium text-primary-600 dark:text-primary-400">
              Play Now →
            </div>
          </div>

          <div className="card-interactive p-8 group cursor-pointer">
            <div className="text-accent-500 dark:text-accent-400 mb-6 group-hover:scale-105 transition-transform flex justify-center">
              <DiceIcon size={56} />
            </div>
            <h3 className="text-xl font-semibold text-neutral-950 dark:text-white mb-3">
              Dice Games
            </h3>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-6">
              Classic dice games with a modern twist. Fast, fair, and fun to play.
            </p>
            <div className="text-sm font-medium text-primary-600 dark:text-primary-400">
              Play Now →
            </div>
          </div>

          <div className="card-interactive p-8 group cursor-pointer">
            <div className="text-success-500 dark:text-success-400 mb-6 group-hover:scale-105 transition-transform flex justify-center">
              <CardSuitIcon size={56} />
            </div>
            <h3 className="text-xl font-semibold text-neutral-950 dark:text-white mb-3">
              Card Games
            </h3>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-6">
              Enjoy classic card games with friends. Test your skills and earn rewards.
            </p>
            <div className="text-sm font-medium text-primary-600 dark:text-primary-400">
              Play Now →
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="max-w-4xl mx-auto">
        <div className="card-elevated p-12">
          <h2 className="text-3xl md:text-4xl font-semibold text-center text-neutral-950 dark:text-white mb-12">
            Why Choose House of Voi?
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="text-primary-500 dark:text-primary-400 bg-primary-50 dark:bg-primary-950 p-3 rounded-xl h-fit">
                <BoltIcon size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-950 dark:text-white mb-2">Fast & Easy</h3>
                <p className="text-neutral-700 dark:text-neutral-300">
                  Quick rewards and simple gameplay. Start playing in seconds.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-primary-500 dark:text-primary-400 bg-primary-50 dark:bg-primary-950 p-3 rounded-xl h-fit">
                <LockIcon size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-950 dark:text-white mb-2">Transparent</h3>
                <p className="text-neutral-700 dark:text-neutral-300">
                  Every game is verifiable on the blockchain. Fair and open.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-primary-500 dark:text-primary-400 bg-primary-50 dark:bg-primary-950 p-3 rounded-xl h-fit">
                <GlobeIcon size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-950 dark:text-white mb-2">Multi-Chain</h3>
                <p className="text-neutral-700 dark:text-neutral-300">
                  Play on Base, Voi, or Solana. Your choice, your experience.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-primary-500 dark:text-primary-400 bg-primary-50 dark:bg-primary-950 p-3 rounded-xl h-fit">
                <CoinsIcon size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-950 dark:text-white mb-2">Earn Together</h3>
                <p className="text-neutral-700 dark:text-neutral-300">
                  Invite friends and share in the rewards. Everyone wins.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-5xl mx-auto">
        <div className="card-elevated p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-950/30 dark:to-accent-950/30"></div>
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-semibold text-neutral-950 dark:text-white mb-6">
              Ready to Play?
            </h2>
            <p className="text-lg text-neutral-700 dark:text-neutral-300 mb-10 max-w-2xl mx-auto">
              Connect your wallet and start enjoying games. Simple, fast, and fun.
            </p>
            <Button variant="primary" size="lg">
              <a href="/auth" className="flex items-center gap-3">
                <SlotMachineIcon size={20} />
                Get Started
              </a>
            </Button>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-6">
              Play responsibly and have fun!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
