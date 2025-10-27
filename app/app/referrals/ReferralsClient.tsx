'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

export default function ReferralsClient() {
  const router = useRouter();
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
    fetchStats();
  }, []);


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-black text-gold-400 neon-text uppercase">
            Referrals
          </h1>
          <p className="text-tertiary mt-2">Loading your referral stats...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-black text-gold-400 neon-text uppercase">
            Referrals
          </h1>
          <p className="text-ruby-400 mt-4">{error || 'Failed to load stats'}</p>
        </div>
      </div>
    );
  }

  const slotsRemaining = stats.maxReferrals - stats.activeReferrals;

  return (
    <div className="space-y-8">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="md"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          ← Back
        </Button>
        <div className="flex-1 text-center">
          <h1 className="text-5xl font-black text-gold-400 neon-text uppercase">
            Referrals
          </h1>
          <p className="text-tertiary text-lg mt-2">
            Create unique codes for each person you invite
          </p>
        </div>
        <div className="w-24"></div> {/* Spacer for centering */}
      </div>

      {/* Create New Code Section */}
      <Card glow>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-tertiary text-sm">Your Referral Codes</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-gold-400">
                  {stats.codesGenerated}
                </span>
                <span className="text-xl text-tertiary">/ {stats.maxReferrals}</span>
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
          <h2 className="text-xl font-bold text-gold-400">Your Codes</h2>
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
                        <span className="font-mono text-2xl font-black text-gold-400">
                          {code.code}
                        </span>
                        {isConverted && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30 uppercase font-bold">
                            Active
                          </span>
                        )}
                        {isPending && (
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30 uppercase font-bold">
                            Pending
                          </span>
                        )}
                        {isUnused && (
                          <span className="px-2 py-0.5 bg-neutral-300/50 dark:bg-neutral-700/50 text-neutral-600 dark:text-neutral-400 text-xs rounded-full border border-neutral-400 dark:border-neutral-600 uppercase font-bold">
                            Unused
                          </span>
                        )}
                        {code.deactivatedAt && (
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30 uppercase font-bold">
                            Deactivated
                          </span>
                        )}
                      </div>

                      {isConverted ? (
                        <p className="text-sm text-tertiary">
                          Converted {new Date(code.convertedAt!).toLocaleDateString()}
                        </p>
                      ) : isPending ? (
                        <p className="text-sm text-tertiary">
                          Link clicked {new Date(code.attributedAt!).toLocaleDateString()} • Awaiting signup
                        </p>
                      ) : code.deactivatedAt ? (
                        <p className="text-sm text-tertiary">
                          Deactivated {new Date(code.deactivatedAt).toLocaleDateString()}
                        </p>
                      ) : (
                        <p className="text-sm text-tertiary">
                          Created {new Date(code.createdAt).toLocaleDateString()} • Not yet shared
                        </p>
                      )}

                      {!code.deactivatedAt && (
                        <div className="mt-3 text-xs font-mono text-neutral-600 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-900 px-3 py-2 rounded border border-neutral-300 dark:border-neutral-800">
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
                              className="text-red-400 border-red-500/30 hover:bg-red-500/10"
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
            <div className="text-4xl font-black text-green-400">
              {stats.activeReferrals}
            </div>
            <p className="text-secondary">Active Referrals</p>
            <p className="text-sm text-tertiary">
              {slotsRemaining} slot{slotsRemaining !== 1 ? 's' : ''} remaining
            </p>
          </CardContent>
        </Card>

        {/* Queued Referrals */}
        <Card>
          <CardContent className="text-center space-y-2">
            <div className="text-4xl font-black text-yellow-400">
              {stats.queuedReferrals}
            </div>
            <p className="text-secondary">In Queue</p>
            <p className="text-sm text-tertiary">
              Waiting for slots to open
            </p>
          </CardContent>
        </Card>

        {/* Total Referrals */}
        <Card>
          <CardContent className="text-center space-y-2">
            <div className="text-4xl font-black text-gold-400">
              {stats.totalReferrals}
            </div>
            <p className="text-secondary">Total Referrals</p>
            <p className="text-sm text-tertiary">All-time signups</p>
          </CardContent>
        </Card>
      </div>

      {/* Capacity Bar */}
      <Card>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-secondary font-semibold">
              Referral Capacity
            </span>
            <span className="text-gold-400 font-bold">
              {stats.activeReferrals} / {stats.maxReferrals}
            </span>
          </div>
          <div className="w-full bg-neutral-300 dark:bg-neutral-800 rounded-full h-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{
                width: `${(stats.activeReferrals / stats.maxReferrals) * 100}%`,
              }}
            />
          </div>
          {stats.queuedReferrals > 0 && (
            <p className="text-sm text-yellow-400">
              💡 You have {stats.queuedReferrals} referral
              {stats.queuedReferrals !== 1 ? 's' : ''} waiting in queue. They
              will be activated when slots become available.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardContent className="space-y-4">
          <h3 className="text-xl font-bold text-gold-400">How It Works</h3>
          <ul className="space-y-2 text-secondary">
            <li className="flex items-start gap-2">
              <span className="text-gold-400 mt-1">•</span>
              <span>
                Create unique one-time-use codes for each person you want to invite
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gold-400 mt-1">•</span>
              <span>
                You can generate up to {stats.maxReferrals} codes total
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gold-400 mt-1">•</span>
              <span>
                Each code can only be used by one person
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gold-400 mt-1">•</span>
              <span>
                You can have up to {stats.maxReferrals} active referrals - additional signups join a queue
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
