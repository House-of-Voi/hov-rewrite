import Card, { CardContent, CardHeader } from '@/components/Card';
import { CoinsIcon } from '@/components/icons';
import type { GrandTotal } from '@/lib/types/admin';
import { formatNumberCompact } from '@/lib/utils/format';

interface GrandTotalCardProps {
  grandTotal: GrandTotal;
}

export default function GrandTotalCard({ grandTotal }: GrandTotalCardProps) {
  const totalWagered = parseFloat(grandTotal.total_balance);
  const totalPaid = parseFloat(grandTotal.total_reserved);
  const netProfit = parseFloat(grandTotal.total_available);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-semibold text-neutral-950 dark:text-white uppercase flex items-center gap-2">
          <CoinsIcon size={28} />
          Platform Performance (All Time)
        </h2>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center p-6 rounded-xl border-2 border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20">
            <div className="text-sm text-neutral-600 dark:text-neutral-400 uppercase tracking-wider font-bold mb-2">
              Total Wagered
            </div>
            <div className="text-4xl font-black text-primary-600 dark:text-primary-400">
              {formatNumberCompact(totalWagered)} VOI
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">Across all machines</div>
          </div>

          <div className="text-center p-6 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
            <div className="text-sm text-neutral-600 dark:text-neutral-400 uppercase tracking-wider font-bold mb-2">
              Total Paid Out
            </div>
            <div className="text-3xl font-black text-neutral-700 dark:text-neutral-300">
              {formatNumberCompact(totalPaid)} VOI
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">Player rewards distributed</div>
          </div>

          <div className="text-center p-6 rounded-xl border border-success-300 dark:border-success-700 bg-success-50 dark:bg-success-900/20">
            <div className="text-sm text-neutral-600 dark:text-neutral-400 uppercase tracking-wider font-bold mb-2">
              House Profit
            </div>
            <div className="text-3xl font-black text-success-600 dark:text-success-400">
              {formatNumberCompact(netProfit)} VOI
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">Net platform result</div>
          </div>

          <div className="text-center p-6 rounded-xl border border-accent-300 dark:border-accent-700 bg-accent-50 dark:bg-accent-900/20">
            <div className="text-sm text-neutral-600 dark:text-neutral-400 uppercase tracking-wider font-bold mb-2">
              Active Machines
            </div>
            <div className="text-3xl font-black text-accent-600 dark:text-accent-400">
              {grandTotal.total_machines}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">Contracts being tracked</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
