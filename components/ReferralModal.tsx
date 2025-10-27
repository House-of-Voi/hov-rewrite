'use client';

import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import CopyButton from './CopyButton';
import { TicketIcon } from './icons';
import { formatCurrency } from '@/lib/referrals/credits';

interface ReferralCode {
  id: string;
  code: string;
  referredProfileId: string | null;
  attributedAt: string | null;
  convertedAt: string | null;
  deactivatedAt: string | null;
  createdAt: string;
}

interface ReferralDetail {
  username: string;
  profile_id: string;
  joined_at: string;
  gamesPlayed: number;
  creditsEarned: number;
  totalWagered: number;
}

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  codes: ReferralCode[];
  referralDetails: Partial<Record<string, ReferralDetail>>;
  codesAvailable: number;
  onRefresh: () => void;
}

export default function ReferralModal({
  isOpen,
  onClose,
  codes,
  referralDetails,
  codesAvailable,
  onRefresh,
}: ReferralModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  const handleCreateCode = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/referrals/create', {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to create referral code');
        return;
      }

      // Refresh the list
      onRefresh();
    } catch (error) {
      console.error('Error creating code:', error);
      alert('Failed to create referral code');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeactivate = async (codeId: string) => {
    if (!confirm('Are you sure you want to deactivate this code?')) {
      return;
    }

    setDeactivatingId(codeId);
    try {
      const response = await fetch('/api/referrals/deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codeId }),
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to deactivate code');
        return;
      }

      // Refresh the list
      onRefresh();
    } catch (error) {
      console.error('Error deactivating code:', error);
      alert('Failed to deactivate code');
    } finally {
      setDeactivatingId(null);
    }
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Referral Codes" size="xl">
      <div className="space-y-6">
        {/* Header Info */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-warning-100 dark:from-warning-900/20 to-primary-100 dark:to-primary-900/20 border border-warning-300 dark:border-warning-500/20">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Each code is for one specific person. Earn <span className="text-warning-500 dark:text-warning-400 font-bold">0.5% of their wagers</span> as free game credits!
          </p>
        </div>

        {/* Create Code Button */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-neutral-400">
            {codesAvailable > 0 ? (
              <span>
                You can create <span className="text-warning-500 dark:text-warning-400 font-bold">{codesAvailable}</span> more code
                {codesAvailable !== 1 ? 's' : ''}
              </span>
            ) : (
              <span className="text-error-600 dark:text-error-400">You&apos;ve reached your limit of referral codes</span>
            )}
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreateCode}
            disabled={isCreating || codesAvailable <= 0}
          >
            <div className="flex items-center gap-2">
              <TicketIcon size={16} />
              <span>{isCreating ? 'Creating...' : 'Create New Code'}</span>
            </div>
          </Button>
        </div>

        {/* Referral Codes List */}
        <div className="space-y-4">
          {codes.map((code) => {
            const details = referralDetails[code.code];
            const isConverted = !!code.referredProfileId;
            const isPending = code.attributedAt && !code.convertedAt;
            const isUnused = !code.attributedAt;

            return (
              <div
                key={code.id}
                className={`p-4 rounded-lg border transition-colors ${
                  isConverted
                    ? 'border-success-300 dark:border-success-500/30 bg-success-50 dark:bg-success-500/5'
                    : isPending
                    ? 'border-warning-300 dark:border-warning-500/30 bg-warning-50 dark:bg-warning-500/5'
                    : 'border-neutral-300 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900/50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-warning-500 dark:text-warning-400 mt-1">
                      <TicketIcon size={24} />
                    </div>
                    <div className="flex-1">
                      {/* Code Header */}
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-lg font-black text-warning-500 dark:text-warning-400">
                          {code.code}
                        </span>
                        {isConverted && (
                          <span className="px-2 py-0.5 bg-success-100 dark:bg-success-500/20 text-success-600 dark:text-success-400 text-xs rounded-full border border-success-300 dark:border-success-500/30 uppercase font-bold">
                            Active
                          </span>
                        )}
                        {isPending && (
                          <span className="px-2 py-0.5 bg-warning-100 dark:bg-warning-500/20 text-warning-600 dark:text-warning-400 text-xs rounded-full border border-warning-300 dark:border-warning-500/30 uppercase font-bold">
                            Pending
                          </span>
                        )}
                        {isUnused && (
                          <span className="px-2 py-0.5 bg-neutral-700/50 text-neutral-400 text-xs rounded-full border border-neutral-600 uppercase font-bold">
                            Unused
                          </span>
                        )}
                        {code.deactivatedAt && (
                          <span className="px-2 py-0.5 bg-error-100 dark:bg-error-500/20 text-error-600 dark:text-error-400 text-xs rounded-full border border-error-300 dark:border-error-500/30 uppercase font-bold">
                            Deactivated
                          </span>
                        )}
                      </div>

                      {/* Referral Details */}
                      {isConverted && details ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-royal-500/20 flex items-center justify-center text-royal-400 font-bold text-sm">
                              {details.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-neutral-300">{details.username}</div>
                              <div className="text-xs text-neutral-500">
                                Joined {new Date(details.joined_at).toLocaleDateString()} •{' '}
                                {details.gamesPlayed} games played
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="p-2 rounded bg-neutral-900/50 border border-neutral-800">
                              <div className="text-xs text-neutral-500 mb-1">Credits Earned</div>
                              <div className="text-sm font-bold text-warning-500 dark:text-warning-400">
                                ${formatCurrency(details.creditsEarned)}
                              </div>
                            </div>
                            <div className="p-2 rounded bg-neutral-900/50 border border-neutral-800">
                              <div className="text-xs text-neutral-500 mb-1">Total Wagered</div>
                              <div className="text-sm font-bold text-royal-400">
                                ${formatCurrency(details.totalWagered)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : isPending ? (
                        <div className="text-sm text-neutral-400">
                          Link clicked {new Date(code.attributedAt!).toLocaleDateString()} • Awaiting
                          signup
                        </div>
                      ) : (
                        <div className="text-sm text-neutral-400">
                          Created {new Date(code.createdAt).toLocaleDateString()} • Not yet shared
                        </div>
                      )}

                      {/* Link */}
                      {!code.deactivatedAt && (
                        <div className="mt-3 text-xs font-mono text-neutral-500 bg-neutral-900 px-2 py-1 rounded border border-neutral-800">
                          {`https://houseofvoi.com/r/${code.code}`}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {!code.deactivatedAt && (
                      <>
                        <CopyButton
                          text={`https://houseofvoi.com/r/${code.code}`}
                          label="Copy"
                        />
                        {!isConverted && (
                          <button
                            onClick={() => handleDeactivate(code.id)}
                            disabled={deactivatingId === code.id}
                            className="px-3 py-1.5 text-xs text-error-600 dark:text-error-400 border border-error-300 dark:border-error-500/30 rounded hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors disabled:opacity-50"
                          >
                            {deactivatingId === code.id ? 'Deactivating...' : 'Deactivate'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Tip */}
        <div className="pt-4 border-t border-neutral-800">
          <p className="text-sm text-neutral-500">
            <strong className="text-neutral-400">Tip:</strong> Create unique codes for each person
            you want to invite. Once they sign up and play, you&rsquo;ll earn 0.5% of their wagers as
            free credits!
          </p>
        </div>
      </div>
    </Modal>
  );
}
