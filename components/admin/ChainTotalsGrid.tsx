import Card, { CardContent, CardHeader } from '@/components/Card';
import ChainBadge from '@/components/ChainBadge';
import type { ChainTotal } from '@/lib/types/admin';

interface ChainTotalsGridProps {
  chainTotals: ChainTotal[];
}

export default function ChainTotalsGrid({ chainTotals }: ChainTotalsGridProps) {
  if (chainTotals.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-2xl font-black text-gold-400 uppercase mb-4 neon-text">
        Treasury by Chain
      </h2>
      <div className="grid md:grid-cols-3 gap-6">
        {chainTotals.map((chainTotal) => {
          const balance = parseFloat(chainTotal.total_balance);
          const available = parseFloat(chainTotal.total_available);

          return (
            <Card key={chainTotal.chain}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <ChainBadge chain={chainTotal.chain} />
                  <span className="text-xs text-neutral-500 uppercase tracking-wider font-bold">
                    {chainTotal.machine_count} Machine{chainTotal.machine_count !== 1 ? 's' : ''}
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
                      {balance.toFixed(2)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gold-900/20">
                    <div>
                      <div className="text-xs text-neutral-600 uppercase tracking-wider font-bold mb-1">
                        Available
                      </div>
                      <div className="text-xl font-bold text-green-400">
                        {available.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-neutral-600 uppercase tracking-wider font-bold mb-1">
                        Reserved
                      </div>
                      <div className="text-xl font-bold text-neutral-400">
                        {parseFloat(chainTotal.total_reserved).toFixed(2)}
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
