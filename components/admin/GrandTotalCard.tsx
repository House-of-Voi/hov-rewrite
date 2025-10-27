import Card, { CardContent, CardHeader } from '@/components/Card';
import { CoinsIcon } from '@/components/icons';
import type { GrandTotal } from '@/lib/types/admin';

interface GrandTotalCardProps {
  grandTotal: GrandTotal;
}

export default function GrandTotalCard({ grandTotal }: GrandTotalCardProps) {
  const balance = parseFloat(grandTotal.total_balance);
  const reserved = parseFloat(grandTotal.total_reserved);
  const available = parseFloat(grandTotal.total_available);

  return (
    <Card glow>
      <CardHeader>
        <h2 className="text-2xl font-black text-gold-400 uppercase flex items-center gap-2 neon-text">
          <CoinsIcon size={28} />
          Grand Total Treasury
        </h2>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center p-6 rounded-xl border-2 border-gold-500/30 bg-gold-500/10">
            <div className="text-sm text-neutral-500 uppercase tracking-wider font-bold mb-2">
              Total Balance
            </div>
            <div className="text-4xl font-black text-gold-400">
              {balance.toFixed(2)}
            </div>
            <div className="text-xs text-neutral-600 mt-1">VOI</div>
          </div>

          <div className="text-center p-6 rounded-xl border border-gold-900/20 bg-neutral-900/50">
            <div className="text-sm text-neutral-500 uppercase tracking-wider font-bold mb-2">
              Reserved
            </div>
            <div className="text-3xl font-black text-neutral-300">
              {reserved.toFixed(2)}
            </div>
            <div className="text-xs text-neutral-600 mt-1">Pending Payouts</div>
          </div>

          <div className="text-center p-6 rounded-xl border border-gold-900/20 bg-green-500/10">
            <div className="text-sm text-neutral-500 uppercase tracking-wider font-bold mb-2">
              Available
            </div>
            <div className="text-3xl font-black text-green-400">
              {available.toFixed(2)}
            </div>
            <div className="text-xs text-neutral-600 mt-1">Ready to Play</div>
          </div>

          <div className="text-center p-6 rounded-xl border border-gold-900/20 bg-royal-500/10">
            <div className="text-sm text-neutral-500 uppercase tracking-wider font-bold mb-2">
              Active Machines
            </div>
            <div className="text-3xl font-black text-royal-400">
              {grandTotal.total_machines}
            </div>
            <div className="text-xs text-neutral-600 mt-1">Contracts</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
