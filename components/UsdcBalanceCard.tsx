'use client';

import { useState, useEffect } from 'react';
import { fetchAllBalances, formatBalance } from '@/lib/voi/balances';
import { openIBuyVoiWidget, isPopupBlocked } from '@/lib/voi/ibuyvoi';
import type { AssetBalance } from '@/lib/voi/balances';
import Button from './Button';
import Card, { CardContent, CardHeader } from './Card';

interface UsdcBalanceCardProps {
  address: string;
}

export default function UsdcBalanceCard({ address }: UsdcBalanceCardProps) {
  const [usdcBalance, setUsdcBalance] = useState<AssetBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [depositStatus, setDepositStatus] = useState<string | null>(null);

  const loadBalance = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchAllBalances(address);
      setUsdcBalance(data.usdc);
      setLastFetched(new Date());
    } catch (err) {
      console.error('Error loading USDC balance:', err);
      setError('Failed to load balance');
    } finally {
      setLoading(false);
    }
  };

  // Load balance on mount
  useEffect(() => {
    loadBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const handleDeposit = () => {
    const popup = openIBuyVoiWidget(address, () => {
      // Auto-refresh balance when popup closes
      setDepositStatus('Refreshing balance...');
      setTimeout(() => {
        loadBalance();
        setDepositStatus(null);
      }, 1000);
    });

    if (isPopupBlocked(popup)) {
      setError('Popup was blocked. Please allow popups for this site.');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleRefresh = () => {
    loadBalance();
  };

  if (loading && !lastFetched) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <p className="text-neutral-400">Loading USDC balance...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formattedBalance = usdcBalance
    ? formatBalance(usdcBalance.balance, usdcBalance.decimals)
    : '0.00';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gold-400 uppercase">USDC Balance</h2>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="text-xs text-gold-400 hover:text-gold-300 disabled:text-neutral-600 transition-colors"
            title="Refresh balance"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Prominent Balance Display */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-gold-500/20 border-2 border-gold-500/30 mb-6">
          <div className="text-center space-y-3">
            <div className="space-y-1">
              <div className="text-5xl font-black text-gold-400 font-mono">
                {formattedBalance}
              </div>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-4 p-3 bg-ruby-500/20 border border-ruby-500/30 rounded-lg">
            <p className="text-sm text-ruby-400 text-center">{error}</p>
          </div>
        )}

        {depositStatus && (
          <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-400 text-center">{depositStatus}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="primary"
            size="lg"
            onClick={handleDeposit}
            className="flex-1 font-black uppercase tracking-wide"
          >
            Deposit USDC
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="flex-1 font-bold uppercase tracking-wide"
            disabled
          >
            Withdraw (Soon)
          </Button>
        </div>

        {/* Helper Text */}
        <p className="text-xs text-neutral-500 text-center mt-4">
          USDC is your primary currency. Use it to play games and manage your account.
        </p>

        {lastFetched && (
          <p className="text-xs text-neutral-600 text-center mt-2">
            Last updated: {lastFetched.toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
