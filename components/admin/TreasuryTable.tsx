import Card, { CardContent } from '@/components/Card';
import ChainBadge from '@/components/ChainBadge';
import type { TreasuryItem } from '@/lib/types/admin';
import { formatNumberCompact } from '@/lib/utils/format';

interface TreasuryTableProps {
  treasuries: TreasuryItem[];
}

const gameTypeIcons: Record<string, string> = {
  slots: '🎰',
  keno: '🎲',
  roulette: '🎯',
};

export default function TreasuryTable({ treasuries }: TreasuryTableProps) {
  if (treasuries.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-12 text-neutral-500">
            No treasury data available. Add slot machines or games to see their treasuries here.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-neutral-950 dark:text-white uppercase mb-4">
        Machine Performance
      </h2>
      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                    Machine
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                    Chain
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                    Total Wagered (VOI)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                    Paid Out (VOI)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                    Net Profit (VOI)
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                    Contract ID
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {treasuries.map((treasury) => {
                  const balance = parseFloat(treasury.balance);
                  const reserved = parseFloat(treasury.reserved);
                  const available = parseFloat(treasury.available);

                  return (
                    <tr key={`${treasury.contract_id}-${treasury.chain}`} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{gameTypeIcons[treasury.game_type]}</span>
                          <span className="font-bold text-neutral-900 dark:text-neutral-100">{treasury.game_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <ChainBadge chain={treasury.chain} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-bold text-primary-600 dark:text-primary-400 text-lg">
                          {formatNumberCompact(balance)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-bold text-neutral-600 dark:text-neutral-400">
                          {formatNumberCompact(reserved)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-bold text-success-600 dark:text-success-400 text-lg">
                          {formatNumberCompact(available)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <code className="px-2 py-1 text-xs font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded border border-neutral-300 dark:border-neutral-700">
                          {treasury.contract_id}
                        </code>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary Footer */}
          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <div className="text-sm text-neutral-600 dark:text-neutral-400 text-center">
              Showing {treasuries.length} machine{treasuries.length !== 1 ? 's' : ''} across all chains
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
