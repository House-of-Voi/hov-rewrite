'use client';
import { useState } from 'react';
import Card, { CardContent, CardHeader } from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';

interface WaitlistClientProps {
  profile: {
    id: string;
    email: string;
    displayName: string | null;
    waitlistPosition: number | null;
    joinedAt: string | null;
  };
  hasReferral: boolean;
  referrerInfo: {
    name: string;
    isActive: boolean;
  } | null;
  totalOnWaitlist: number;
}

export default function WaitlistClient({
  profile,
  hasReferral,
  referrerInfo,
  totalOnWaitlist,
}: WaitlistClientProps) {
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleAddReferral = async () => {
    if (!referralCode || referralCode.length !== 7) {
      setStatus({ type: 'error', message: 'Please enter a valid 7-character referral code' });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch('/api/waitlist/add-referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode: referralCode.toUpperCase() }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Failed to add referral code');
      }

      setStatus({ type: 'success', message: 'Referral code added successfully! Refreshing...' });

      // Refresh the page to show updated info
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Add referral error:', error);
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to add referral code',
      });
    } finally {
      setLoading(false);
    }
  };

  const joinedDate = profile.joinedAt ? new Date(profile.joinedAt).toLocaleDateString() : 'Unknown';

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-3">
        <h1 className="text-5xl font-black text-gold-400 neon-text uppercase">
          Waitlist
        </h1>
        <p className="text-neutral-400 text-lg">
          You&apos;re on the waitlist for game access
        </p>
      </div>

      {/* Status Banner */}
      {status && (
        <div
          className={`p-6 rounded-xl text-center font-semibold text-lg ${
            status.type === 'success'
              ? 'bg-green-500/20 text-green-400 border-2 border-green-500/30'
              : 'bg-ruby-500/20 text-ruby-400 border-2 border-ruby-500/30'
          }`}
        >
          {status.message}
        </div>
      )}

      {/* Waitlist Status Card */}
      <Card glow>
        <CardHeader>
          <h2 className="text-2xl font-bold text-gold-400 uppercase">Your Status</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 border border-gold-900/20 rounded-xl bg-gradient-to-br from-gold-500/5 to-transparent">
              <div className="text-neutral-500 text-sm uppercase tracking-wider mb-2">
                Position
              </div>
              <div className="text-4xl font-black text-gold-400">
                {profile.waitlistPosition || '—'}
              </div>
              <div className="text-neutral-400 text-sm mt-2">
                {totalOnWaitlist > 0 ? `of ${totalOnWaitlist} total` : 'Pending assignment'}
              </div>
            </div>

            <div className="p-6 border border-gold-900/20 rounded-xl bg-gradient-to-br from-gold-500/5 to-transparent">
              <div className="text-neutral-500 text-sm uppercase tracking-wider mb-2">
                Joined
              </div>
              <div className="text-2xl font-bold text-gold-400">
                {joinedDate}
              </div>
              <div className="text-neutral-400 text-sm mt-2">
                Waiting for admin approval
              </div>
            </div>
          </div>

          {referrerInfo && (
            <div className="p-6 border border-gold-900/20 rounded-xl bg-gradient-to-br from-blue-500/5 to-transparent">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-neutral-500 text-sm uppercase tracking-wider mb-2">
                    Referred By
                  </div>
                  <div className="text-xl font-bold text-gold-400">
                    {referrerInfo.name}
                  </div>
                </div>
                <div
                  className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                    referrerInfo.isActive
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}
                >
                  {referrerInfo.isActive ? 'Active Boost' : 'On Waitlist'}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Referral Code (if not already have one) */}
      {!hasReferral && (
        <Card glow>
          <CardHeader>
            <h2 className="text-2xl font-bold text-gold-400 uppercase">
              Boost Your Position
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-neutral-400">
              Have a referral code? Add it here to potentially improve your position on the waitlist.
            </p>
            <div className="flex gap-4">
              <Input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="Enter 7-character code"
                maxLength={7}
                className="flex-1"
              />
              <Button
                variant="primary"
                size="md"
                onClick={handleAddReferral}
                disabled={loading || referralCode.length !== 7}
                loading={loading}
              >
                Add Code
              </Button>
            </div>
            {referralCode && referralCode.length !== 7 && (
              <p className="text-sm text-neutral-500">
                {7 - referralCode.length} characters remaining
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-gold-400 uppercase">
            How It Works
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-neutral-400">
            <p>
              <span className="text-gold-400 font-semibold">1. Waitlist:</span> All new users start on the waitlist. Admins manually approve users for game access.
            </p>
            <p>
              <span className="text-gold-400 font-semibold">2. Referrals:</span> If you have a referral code, adding it may boost your position in the queue.
            </p>
            <p>
              <span className="text-gold-400 font-semibold">3. Access:</span> Once approved by an admin, you&apos;ll be able to access all games on the platform.
            </p>
            <p>
              <span className="text-gold-400 font-semibold">4. Your Code:</span> Your referral code is <span className="font-mono font-bold text-gold-400">{profile.displayName || profile.email}</span>. Share it with friends once you get access!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <a href="/app">
          <Button variant="secondary" size="md">
            ← Back to Dashboard
          </Button>
        </a>
      </div>
    </div>
  );
}
