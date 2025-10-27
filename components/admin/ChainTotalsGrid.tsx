import Card, { CardContent, CardHeader } from '@/components/Card';
import ChainBadge from '@/components/ChainBadge';
import type { ChainTotal } from '@/lib/types/admin';
import { formatNumberCompact } from '@/lib/utils/format';

interface ChainTotalsGridProps {
  chainTotals: ChainTotal[];
}

export default function ChainTotalsGrid({ chainTotals }: ChainTotalsGridProps) {
  if (chainTotals.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-neutral-950 dark:text-white uppercase mb-4">
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
                  <span className="text-xs text-neutral-600 dark:text-neutral-400 uppercase tracking-wider font-bold">
                    {chainTotal.machine_count} Machine{chainTotal.machine_count !== 1 ? 's' : ''}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 uppercase tracking-wider font-bold mb-1">
                      Total Balance
                    </div>
                    <div className="text-3xl font-black text-primary-600 dark:text-primary-400">
                      {formatNumberCompact(balance)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                    <div>
                      <div className="text-xs text-neutral-600 dark:text-neutral-400 uppercase tracking-wider font-bold mb-1">
                        Available
                      </div>
                      <div className="text-xl font-bold text-success-600 dark:text-success-400">
                        {formatNumberCompact(available)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-neutral-600 dark:text-neutral-400 uppercase tracking-wider font-bold mb-1">
                        Reserved
                      </div>
                      <div className="text-xl font-bold text-neutral-600 dark:text-neutral-400">
                        {formatNumberCompact(parseFloat(chainTotal.total_reserved))}
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
