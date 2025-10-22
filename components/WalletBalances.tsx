'use client';

import { useState, useEffect } from 'react';
import { fetchAllBalances, formatBalance, formatUsdValue } from '@/lib/voi/balances';
import type { AssetBalance } from '@/lib/voi/balances';
import SwapPlaceholderModal from './SwapPlaceholderModal';
import Button from './Button';

interface WalletBalancesProps {
  address: string;
}

export default function WalletBalances({ address }: WalletBalancesProps) {
  const [balances, setBalances] = useState<AssetBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
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
      setBalances(data.otherTokens); // Only set other tokens (VOI, UNIT)
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

  const handleRefresh = () => {
    loadBalances();
  };

  const handleDeposit = (tokenSymbol: string) => {
    setSwapModal({
      isOpen: true,
      tokenSymbol,
      action: 'deposit',
    });
  };

  const handleWithdraw = (tokenSymbol: string) => {
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
      <div className="mt-3 p-3 bg-gold-500/5 border border-gold-500/20 rounded-lg">
        <p className="text-sm text-neutral-400">Loading balances...</p>
      </div>
    );
  }

  if (error && balances.length === 0) {
    return (
      <div className="mt-3 p-3 bg-ruby-500/10 border border-ruby-500/30 rounded-lg">
        <p className="text-sm text-ruby-400">{error}</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">
            Other Tokens
          </p>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="text-xs text-gold-400 hover:text-gold-300 disabled:text-neutral-600 transition-colors"
            title="Refresh balances"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {balances.length === 0 ? (
          <div className="p-3 bg-neutral-800/50 border border-neutral-700 rounded-lg">
            <p className="text-sm text-neutral-500">No other tokens found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {balances.map((balance) => {
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
                      onClick={() => handleDeposit(balance.symbol)}
                      className="flex-1 px-3 py-2 text-xs font-semibold bg-green-600/20 text-green-400 border border-green-500/30 rounded hover:bg-green-600/30 transition-colors uppercase tracking-wide"
                    >
                      Deposit
                    </button>
                    <button
                      onClick={() => handleWithdraw(balance.symbol)}
                      className="flex-1 px-3 py-2 text-xs font-semibold bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-600/30 transition-colors uppercase tracking-wide"
                    >
                      Withdraw
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {lastFetched && (
          <p className="text-xs text-neutral-600 text-right">
            Last updated: {lastFetched.toLocaleTimeString()}
          </p>
        )}
      </div>

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
