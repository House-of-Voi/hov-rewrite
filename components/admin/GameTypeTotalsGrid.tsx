import Card, { CardContent, CardHeader } from '@/components/Card';
import { SlotMachineIcon } from '@/components/icons';
import type { GameTypeTotal } from '@/lib/types/admin';
import { formatNumberCompact } from '@/lib/utils/format';

interface GameTypeTotalsGridProps {
  gameTypeTotals: GameTypeTotal[];
}

const gameTypeIcons: Record<string, string> = {
  slots: '🎰',
  keno: '🎲',
  roulette: '🎯',
};

const gameTypeNames: Record<string, string> = {
  slots: 'Slot Machines',
  keno: 'Keno',
  roulette: 'Roulette',
};

export default function GameTypeTotalsGrid({ gameTypeTotals }: GameTypeTotalsGridProps) {
  if (gameTypeTotals.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-2xl font-black text-gold-400 uppercase mb-4 neon-text">
        Treasury by Game Type
      </h2>
      <div className="grid md:grid-cols-3 gap-6">
        {gameTypeTotals.map((gameTypeTotal) => {
          const balance = parseFloat(gameTypeTotal.total_balance);
          const available = parseFloat(gameTypeTotal.total_available);

          return (
            <Card key={gameTypeTotal.game_type}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{gameTypeIcons[gameTypeTotal.game_type]}</span>
                    <span className="text-lg font-bold text-neutral-200 uppercase tracking-wide">
                      {gameTypeNames[gameTypeTotal.game_type]}
                    </span>
                  </div>
                  <span className="text-xs text-neutral-500 uppercase tracking-wider font-bold">
                    {gameTypeTotal.machine_count} Machine{gameTypeTotal.machine_count !== 1 ? 's' : ''}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-neutral-500 uppercase tracking-wider font-bold mb-1">
                      Total Balance
                    </div>
                    <div className="text-3xl font-black text-gold-400">
                      {formatNumberCompact(balance)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gold-900/20">
                    <div>
                      <div className="text-xs text-neutral-600 uppercase tracking-wider font-bold mb-1">
                        Available
                      </div>
                      <div className="text-xl font-bold text-green-400">
                        {formatNumberCompact(available)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-neutral-600 uppercase tracking-wider font-bold mb-1">
                        Reserved
                      </div>
                      <div className="text-xl font-bold text-neutral-400">
                        {formatNumberCompact(parseFloat(gameTypeTotal.total_reserved))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
