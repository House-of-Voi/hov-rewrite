'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import Card, { CardContent } from '@/components/Card';
import Button from '@/components/Button';
import CopyButton from '@/components/CopyButton';
import { TicketIcon } from '@/components/icons';

interface ReferralCodeInfo {
  id: string;
  code: string;
  referredProfileId: string | null;
  attributedAt: string | null;
  convertedAt: string | null;
  deactivatedAt: string | null;
  createdAt: string;
}

interface ReferralStats {
  codesGenerated: number;
  codesAvailable: number;
  maxReferrals: number;
  activeReferrals: number;
  queuedReferrals: number;
  totalReferrals: number;
  codes: ReferralCodeInfo[];
}

interface ReferralCodesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReferralCodesModal({ isOpen, onClose }: ReferralCodesModalProps) {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/referrals/info');
      const data = await response.json();

      if (data.ok) {
        setStats({
          codesGenerated: data.codesGenerated,
          codesAvailable: data.codesAvailable,
          maxReferrals: data.maxReferrals,
          activeReferrals: data.activeReferrals,
          queuedReferrals: data.queuedReferrals,
          totalReferrals: data.totalReferrals,
          codes: data.codes,
        });
      } else {
        setError(data.error || 'Failed to load referral stats');
      }
    } catch (error) {
      console.error('Failed to load referral stats:', error);
      setError('Failed to load referral stats');
    } finally {
      setLoading(false);
    }
  };

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

      fetchStats();
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

      fetchStats();
    } catch (error) {
      console.error('Error deactivating code:', error);
      alert('Failed to deactivate code');
    } finally {
      setDeactivatingId(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      fetchStats();
    }
  }, [isOpen]);

  const slotsRemaining = stats ? stats.maxReferrals - stats.activeReferrals : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Referral Codes" size="full">
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-neutral-700 dark:text-neutral-300">Loading your referral codes...</p>
          </div>
        ) : error || !stats ? (
          <div className="text-center py-8">
            <p className="text-error-600 dark:text-error-400">{error || 'Failed to load stats'}</p>
          </div>
        ) : (
          <>
            {/* Create New Code Section */}
            <Card glow>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-neutral-700 dark:text-neutral-300 text-sm">Your Referral Codes</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-semibold text-primary-600 dark:text-primary-400">
                        {stats.codesGenerated}
                      </span>
                      <span className="text-xl text-neutral-700 dark:text-neutral-300">/ {stats.maxReferrals}</span>
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-500 text-xs mt-1">
                      {stats.codesAvailable > 0 ? (
                        <>You can create {stats.codesAvailable} more code{stats.codesAvailable !== 1 ? 's' : ''}</>
                      ) : (
                        <>You&apos;ve reached your limit</>
                      )}
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleCreateCode}
                    disabled={isCreating || stats.codesAvailable <= 0}
                    className="px-6"
                  >
                    <div className="flex items-center gap-2">
                      <TicketIcon size={20} />
                      <span>{isCreating ? 'Creating...' : 'Create New Code'}</span>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Referral Codes List */}
            {stats.codes.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-neutral-950 dark:text-white">Your Codes</h3>
                {stats.codes.map((code) => {
                  const isConverted = !!code.referredProfileId;
                  const isPending = code.attributedAt && !code.convertedAt;
                  const isUnused = !code.attributedAt;
                  const referralUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${code.code}`;

                  return (
                    <Card key={code.id}>
                      <CardContent className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-mono text-2xl font-semibold text-primary-600 dark:text-primary-400">
                                {code.code}
                              </span>
                              {isConverted && (
                                <span className="px-2 py-0.5 bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300 text-xs rounded-full border border-success-300 dark:border-success-700 uppercase font-semibold">
                                  Active
                                </span>
                              )}
                              {isPending && (
                                <span className="px-2 py-0.5 bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 text-xs rounded-full border border-warning-300 dark:border-warning-700 uppercase font-semibold">
                                  Pending
                                </span>
                              )}
                              {isUnused && (
                                <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs rounded-full border border-neutral-300 dark:border-neutral-700 uppercase font-semibold">
                                  Unused
                                </span>
                              )}
                              {code.deactivatedAt && (
                                <span className="px-2 py-0.5 bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-300 text-xs rounded-full border border-error-300 dark:border-error-700 uppercase font-semibold">
                                  Deactivated
                                </span>
                              )}
                            </div>

                            {isConverted ? (
                              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                                Converted {new Date(code.convertedAt!).toLocaleDateString()}
                              </p>
                            ) : isPending ? (
                              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                                Link clicked {new Date(code.attributedAt!).toLocaleDateString()} • Awaiting signup
                              </p>
                            ) : code.deactivatedAt ? (
                              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                                Deactivated {new Date(code.deactivatedAt).toLocaleDateString()}
                              </p>
                            ) : (
                              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                                Created {new Date(code.createdAt).toLocaleDateString()} • Not yet shared
                              </p>
                            )}

                            {!code.deactivatedAt && (
                              <div className="mt-3 text-xs font-mono text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-900 px-3 py-2 rounded border border-neutral-300 dark:border-neutral-800">
                                {referralUrl}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2">
                            {!code.deactivatedAt && (
                              <>
                                <CopyButton text={referralUrl} label="Copy Link" />
                                {!isConverted && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeactivate(code.id)}
                                    disabled={deactivatingId === code.id}
                                    className="text-error-600 dark:text-error-400 border-error-300 dark:border-error-700 hover:bg-error-50 dark:hover:bg-error-950"
                                  >
                                    {deactivatingId === code.id ? 'Deactivating...' : 'Deactivate'}
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Active Referrals */}
              <Card>
                <CardContent className="text-center space-y-2">
                  <div className="text-4xl font-semibold text-success-700 dark:text-success-300">
                    {stats.activeReferrals}
                  </div>
                  <p className="text-neutral-950 dark:text-white font-medium">Active Referrals</p>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">
                    {slotsRemaining} slot{slotsRemaining !== 1 ? 's' : ''} remaining
                  </p>
                </CardContent>
              </Card>

              {/* Queued Referrals */}
              <Card>
                <CardContent className="text-center space-y-2">
                  <div className="text-4xl font-semibold text-warning-700 dark:text-warning-300">
                    {stats.queuedReferrals}
                  </div>
                  <p className="text-neutral-950 dark:text-white font-medium">In Queue</p>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">
                    Waiting for slots to open
                  </p>
                </CardContent>
              </Card>

              {/* Total Referrals */}
              <Card>
                <CardContent className="text-center space-y-2">
                  <div className="text-4xl font-semibold text-primary-700 dark:text-primary-300">
                    {stats.totalReferrals}
                  </div>
                  <p className="text-neutral-950 dark:text-white font-medium">Total Referrals</p>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">All-time signups</p>
                </CardContent>
              </Card>
            </div>

            {/* Capacity Bar */}
            <Card>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-950 dark:text-white font-semibold">
                    Referral Capacity
                  </span>
                  <span className="text-primary-600 dark:text-primary-400 font-semibold">
                    {stats.activeReferrals} / {stats.maxReferrals}
                  </span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-500"
                    style={{
                      width: `${(stats.activeReferrals / stats.maxReferrals) * 100}%`,
                    }}
                  />
                </div>
                {stats.queuedReferrals > 0 && (
                  <p className="text-sm text-warning-600 dark:text-warning-400">
                    {stats.queuedReferrals} referral
                    {stats.queuedReferrals !== 1 ? 's' : ''} waiting in queue. They
                    will be activated when slots become available.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
              <CardContent className="space-y-4">
                <h3 className="text-xl font-semibold text-primary-600 dark:text-primary-400">How It Works</h3>
                <ul className="space-y-2 text-neutral-700 dark:text-neutral-300">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 dark:text-primary-400 mt-1">•</span>
                    <span>
                      Create unique one-time-use codes for each person you want to invite
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 dark:text-primary-400 mt-1">•</span>
                    <span>
                      You can generate up to {stats.maxReferrals} codes total
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 dark:text-primary-400 mt-1">•</span>
                    <span>
                      Each code can only be used by one person
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 dark:text-primary-400 mt-1">•</span>
                    <span>
                      You can have up to {stats.maxReferrals} active referrals - additional signups join a queue
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Modal>
  );
}
