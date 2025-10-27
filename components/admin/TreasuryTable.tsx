import Card, { CardContent, CardHeader } from '@/components/Card';
import ChainBadge from '@/components/ChainBadge';
import type { TreasuryItem } from '@/lib/types/admin';

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
      <h2 className="text-2xl font-black text-gold-400 uppercase mb-4 neon-text">
        Individual Machine Treasuries
      </h2>
      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-gold-900/20">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gold-400 uppercase tracking-wider">
                    Machine
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gold-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gold-400 uppercase tracking-wider">
                    Chain
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gold-400 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gold-400 uppercase tracking-wider">
                    Reserved
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gold-400 uppercase tracking-wider">
                    Available
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gold-400 uppercase tracking-wider">
                    Contract ID
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-900/10">
                {treasuries.map((treasury) => {
                  const balance = parseFloat(treasury.balance);
                  const reserved = parseFloat(treasury.reserved);
                  const available = parseFloat(treasury.available);

                  return (
                    <tr key={`${treasury.contract_id}-${treasury.chain}`} className="hover:bg-gold-500/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{gameTypeIcons[treasury.game_type]}</span>
                          <span className="font-bold text-neutral-200">{treasury.game_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-bold rounded-full bg-royal-500/20 text-royal-400 border border-royal-500/30 uppercase">
                          {treasury.game_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <ChainBadge chain={treasury.chain} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-bold text-gold-400 text-lg">
                          {balance.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-bold text-neutral-400">
                          {reserved.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-bold text-green-400 text-lg">
                          {available.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <code className="px-2 py-1 text-xs font-mono bg-neutral-900 text-neutral-400 rounded border border-gold-900/20">
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
          <div className="mt-4 pt-4 border-t border-gold-900/20">
            <div className="text-sm text-neutral-500 text-center">
              Showing {treasuries.length} machine{treasuries.length !== 1 ? 's' : ''} across all chains
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
