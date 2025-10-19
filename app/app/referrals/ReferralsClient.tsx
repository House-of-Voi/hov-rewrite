'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card, { CardContent } from '@/components/Card';
import Button from '@/components/Button';

interface ReferralStats {
  referralCode: string;
  activeReferrals: number;
  maxReferrals: number;
  queuedReferrals: number;
  totalReferrals: number;
}

export default function ReferralsClient() {
  const router = useRouter();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/referrals/info');
        const data = await response.json();

        if (data.ok) {
          setStats({
            referralCode: data.referralCode,
            activeReferrals: data.activeReferrals,
            maxReferrals: data.maxReferrals,
            queuedReferrals: data.queuedReferrals,
            totalReferrals: data.totalReferrals,
          });
        } else {
          setError(data.error || 'Failed to load referral stats');
        }
      } catch (err) {
        setError('Failed to load referral stats');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const copyReferralCode = async () => {
    if (!stats) return;

    try {
      const url = `${window.location.origin}/r/${stats.referralCode}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const copyCodeOnly = async () => {
    if (!stats) return;

    try {
      await navigator.clipboard.writeText(stats.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-black text-gold-400 neon-text uppercase">
            Referrals
          </h1>
          <p className="text-neutral-400 mt-2">Loading your referral stats...</p>
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
  const referralUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${stats.referralCode}`;

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
          <p className="text-neutral-400 text-lg mt-2">
            Share your code and grow the House of Voi community
          </p>
        </div>
        <div className="w-24"></div> {/* Spacer for centering */}
      </div>

      {/* Referral Code Card */}
      <Card glow>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-neutral-400 text-sm mb-2">Your Referral Code</p>
            <div className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <span className="text-4xl font-black text-white font-mono tracking-wider">
                {stats.referralCode}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={copyReferralCode}
              className="flex-1"
            >
              {copied ? '✓ Copied!' : 'Copy Referral Link'}
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={copyCodeOnly}
              className="flex-1"
            >
              Copy Code Only
            </Button>
          </div>

          <div className="text-center text-sm text-neutral-500">
            <p className="font-mono break-all">{referralUrl}</p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Active Referrals */}
        <Card>
          <CardContent className="text-center space-y-2">
            <div className="text-4xl font-black text-green-400">
              {stats.activeReferrals}
            </div>
            <p className="text-neutral-400">Active Referrals</p>
            <p className="text-sm text-neutral-500">
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
            <p className="text-neutral-400">In Queue</p>
            <p className="text-sm text-neutral-500">
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
            <p className="text-neutral-400">Total Referrals</p>
            <p className="text-sm text-neutral-500">All-time signups</p>
          </CardContent>
        </Card>
      </div>

      {/* Capacity Bar */}
      <Card>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-neutral-400 font-semibold">
              Referral Capacity
            </span>
            <span className="text-gold-400 font-bold">
              {stats.activeReferrals} / {stats.maxReferrals}
            </span>
          </div>
          <div className="w-full bg-neutral-800 rounded-full h-4 overflow-hidden">
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
              {stats.queuedReferrals !== 1 ? 's' : ''} waiting in queue. They'll
              be activated when slots become available.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardContent className="space-y-4">
          <h3 className="text-xl font-bold text-gold-400">How It Works</h3>
          <ul className="space-y-2 text-neutral-400">
            <li className="flex items-start gap-2">
              <span className="text-gold-400 mt-1">•</span>
              <span>
                Share your unique referral code or link with friends
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gold-400 mt-1">•</span>
              <span>
                Each user can refer up to {stats.maxReferrals} active members
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gold-400 mt-1">•</span>
              <span>
                Additional referrals join a queue and activate when slots open
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gold-400 mt-1">•</span>
              <span>Earn rewards when your referrals play games</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
