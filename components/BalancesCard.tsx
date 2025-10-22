'use client';

import { useState, useEffect } from 'react';
import { fetchAllBalances, formatBalance, formatUsdValue } from '@/lib/voi/balances';
import { openIBuyVoiWidget, isPopupBlocked } from '@/lib/voi/ibuyvoi';
import type { AssetBalance } from '@/lib/voi/balances';
import Button from './Button';
import Card, { CardContent, CardHeader } from './Card';
import SwapPlaceholderModal from './SwapPlaceholderModal';

interface BalancesCardProps {
  address: string;
}

export default function BalancesCard({ address }: BalancesCardProps) {
  const [usdcBalance, setUsdcBalance] = useState<AssetBalance | null>(null);
  const [otherBalances, setOtherBalances] = useState<AssetBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [depositStatus, setDepositStatus] = useState<string | null>(null);
  const [swapModal, setSwapModal] = useState<{
    isOpen: boolean;
    tokenSymbol: string;
    action: 'deposit' | 'withdraw';
  }>({
    isOpen: false,
    tokenSymbol: '',
    action: 'deposit',
  });

  const loadBalances = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchAllBalances(address);
      setUsdcBalance(data.usdc);
      setOtherBalances(data.otherTokens);
      setLastFetched(new Date());
    } catch (err) {
      console.error('Error loading balances:', err);
      setError('Failed to load balances');
    } finally {
      setLoading(false);
    }
  };

  // Load balances on mount
  useEffect(() => {
    loadBalances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const handleDeposit = () => {
    const popup = openIBuyVoiWidget(address, () => {
      // Auto-refresh balance when popup closes
      setDepositStatus('Refreshing balance...');
      setTimeout(() => {
        loadBalances();
        setDepositStatus(null);
      }, 1000);
    });

    if (isPopupBlocked(popup)) {
      setError('Popup was blocked. Please allow popups for this site.');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleRefresh = () => {
    loadBalances();
  };

  const handleTokenDeposit = (tokenSymbol: string) => {
    setSwapModal({
      isOpen: true,
      tokenSymbol,
      action: 'deposit',
    });
  };

  const handleTokenWithdraw = (tokenSymbol: string) => {
    setSwapModal({
      isOpen: true,
      tokenSymbol,
      action: 'withdraw',
    });
  };

  const closeSwapModal = () => {
    setSwapModal({
      isOpen: false,
      tokenSymbol: '',
      action: 'deposit',
    });
  };

  if (loading && !lastFetched) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <p className="text-neutral-400">Loading balances...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formattedUsdcBalance = usdcBalance
    ? formatBalance(usdcBalance.balance, usdcBalance.decimals)
    : '0.00';

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gold-400 uppercase">Your Balances</h2>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="text-xs text-gold-400 hover:text-gold-300 disabled:text-neutral-600 transition-colors"
              title="Refresh balances"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* USDC Balance - Primary Currency */}
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
              Primary Currency
            </p>
            <div className="p-6 rounded-xl bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-gold-500/20 border-2 border-gold-500/30">
              <div className="text-center space-y-4">
                <div className="space-y-1">
                  <div className="text-xs text-neutral-400 uppercase tracking-wider">USDC</div>
                  <div className="text-5xl font-black text-gold-400 font-mono">
                    {formattedUsdcBalance}
                  </div>
                </div>

                {/* Status Messages */}
                {error && (
                  <div className="p-3 bg-ruby-500/20 border border-ruby-500/30 rounded-lg">
                    <p className="text-sm text-ruby-400 text-center">{error}</p>
                  </div>
                )}

                {depositStatus && (
                  <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
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
              </div>
            </div>
          </div>

          {/* Other Tokens */}
          {otherBalances.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
                Other Tokens
              </p>
              <div className="space-y-3">
                {otherBalances.map((balance) => {
                  const formattedBalance = formatBalance(balance.balance, balance.decimals);
                  const formattedUsd = formatUsdValue(balance.usdValue);

                  return (
                    <div
                      key={balance.symbol}
                      className="p-4 bg-gold-500/5 border border-gold-500/20 rounded-lg space-y-3"
                    >
                      {/* Token Info and Balance */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {balance.imageUrl && (
                            <img
                              src={balance.imageUrl}
                              alt={balance.symbol}
                              className="w-7 h-7 rounded-full"
                              onError={(e) => {
                                // Hide image on error
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div>
                            <div className="font-semibold text-neutral-200 text-sm">
                              {balance.symbol}
                            </div>
                            <div className="text-xs text-neutral-500">{balance.name}</div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-mono text-sm font-bold text-gold-400">
                            {formattedBalance}
                          </div>
                          <div className="text-xs text-neutral-500">{formattedUsd}</div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTokenDeposit(balance.symbol)}
                          className="flex-1 px-3 py-2 text-xs font-semibold bg-green-600/20 text-green-400 border border-green-500/30 rounded hover:bg-green-600/30 transition-colors uppercase tracking-wide"
                        >
                          Deposit
                        </button>
                        <button
                          onClick={() => handleTokenWithdraw(balance.symbol)}
                          className="flex-1 px-3 py-2 text-xs font-semibold bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-600/30 transition-colors uppercase tracking-wide"
                        >
                          Withdraw
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Helper Text */}
          <p className="text-xs text-neutral-500 text-center">
            USDC is your primary currency for games. Other tokens may be used for specific machines.
          </p>

          {lastFetched && (
            <p className="text-xs text-neutral-600 text-center">
              Last updated: {lastFetched.toLocaleTimeString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Swap Placeholder Modal */}
      <SwapPlaceholderModal
        isOpen={swapModal.isOpen}
        onClose={closeSwapModal}
        tokenSymbol={swapModal.tokenSymbol}
        action={swapModal.action}
      />
    </>
  );
}

