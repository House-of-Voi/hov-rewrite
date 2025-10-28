'use client';

import { useState, useEffect } from 'react';
import { useSignOut } from '@coinbase/cdp-hooks';
import Card, { CardContent, CardHeader } from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import ChainBadge from '@/components/ChainBadge';
import Avatar from '@/components/Avatar';
import AvatarEditModal from '@/components/AvatarEditModal';
import { TicketIcon } from '@/components/icons';
import type { ProfileWithAccounts } from '@/lib/profile/data';

interface ProfileClientProps {
  initialData: ProfileWithAccounts;
}

interface ReferralStats {
  referralCode: string;
  activeReferrals: number;
  maxReferrals: number;
  queuedReferrals: number;
  totalReferrals: number;
}

export default function ProfileClient({ initialData }: ProfileClientProps) {
  const [profile, setProfile] = useState(initialData.profile);
  const [displayName, setDisplayName] = useState(profile.display_name || '');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [loadingReferrals, setLoadingReferrals] = useState(true);

  const { signOut } = useSignOut();

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setStatus(null);

    try {
      const response = await fetch('/api/profile/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName || null,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setProfile(result.data.profile);
        setStatus({ type: 'success', message: 'Profile updated successfully!' });
      } else {
        setStatus({
          type: 'error',
          message: result.error || 'Failed to update profile',
        });
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      setStatus({
        type: 'error',
        message: 'Network error. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUploadSuccess = (url: string) => {
    setProfile({ ...profile, avatar_url: url });
    setStatus({ type: 'success', message: 'Avatar uploaded successfully!' });
    setTimeout(() => setStatus(null), 3000);
  };

  const handleLogout = async () => {
    try {
      // First sign out from Coinbase CDP
      await signOut();

      // Then call our backend logout endpoint to clear session
      await fetch('/api/auth/logout', { method: 'POST' });

      // Redirect to auth page
      window.location.href = '/auth';
    } catch (error) {
      console.error('Logout error:', error);
      // Still try to logout from backend even if CDP signout fails
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/auth';
    }
  };

  const handleAvatarUploadError = (error: string) => {
    setStatus({ type: 'error', message: error });
    setTimeout(() => setStatus(null), 5000);
  };

  const handleDeleteAvatar = async () => {
    if (!confirm('Are you sure you want to delete your avatar?')) return;

    try {
      const response = await fetch('/api/profile/avatar', {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setProfile(result.data.profile);
        setStatus({ type: 'success', message: 'Avatar deleted successfully!' });
      } else {
        setStatus({ type: 'error', message: result.error || 'Failed to delete avatar' });
      }
    } catch (error) {
      console.error('Failed to delete avatar:', error);
      setStatus({ type: 'error', message: 'Network error. Please try again.' });
    }
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setStatus({ type: 'success', message: 'Address copied to clipboard!' });
    setTimeout(() => setStatus(null), 2000);
  };

  const handleCopyReferralCode = () => {
    if (!referralStats) return;
    const url = `${window.location.origin}/r/${referralStats.referralCode}`;
    navigator.clipboard.writeText(url);
    setStatus({ type: 'success', message: 'Referral link copied to clipboard!' });
    setTimeout(() => setStatus(null), 2000);
  };

  // Fetch referral stats on mount
  useEffect(() => {
    async function fetchReferralStats() {
      try {
        const response = await fetch('/api/referrals/info');
        const data = await response.json();

        if (data.ok) {
          setReferralStats({
            referralCode: data.referralCode,
            activeReferrals: data.activeReferrals,
            maxReferrals: data.maxReferrals,
            queuedReferrals: data.queuedReferrals,
            totalReferrals: data.totalReferrals,
          });
        }
      } catch (err) {
        console.error('Failed to load referral stats:', err);
      } finally {
        setLoadingReferrals(false);
      }
    }

    fetchReferralStats();
  }, []);

  const hasChanges = displayName !== (profile.display_name || '');

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-4xl font-black text-warning-500 dark:text-warning-400 neon-text uppercase">Your Profile</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-2">
          Manage your account information, linked wallets, and referral codes.
        </p>
      </div>

      {/* Status Message */}
      {status && (
        <div
          className={`p-4 rounded-xl text-center font-semibold ${
            status.type === 'success'
              ? 'bg-success-100 dark:bg-success-500/20 text-success-600 dark:text-success-400 border-2 border-success-300 dark:border-success-500/30'
              : 'bg-error-100 dark:bg-error-500/20 text-error-600 dark:text-error-400 border-2 border-error-300 dark:border-error-500/30'
          }`}
        >
          {status.message}
        </div>
      )}

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-6">
            <Avatar
              src={profile.avatar_url}
              displayName={profile.display_name}
              alt={profile.display_name || profile.primary_email}
              size="xl"
              editable
              onEditClick={() => setIsAvatarModalOpen(true)}
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-warning-500 dark:text-warning-400 uppercase">
                {profile.display_name || 'Your Profile'}
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-1">{profile.primary_email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-warning-500 dark:text-warning-400 uppercase mb-4">
              Profile Information
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
              <Input
                label="Email"
                type="email"
                value={profile.primary_email}
                disabled
                placeholder="your@email.com"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="primary"
                size="md"
                onClick={handleSaveProfile}
                disabled={isSaving || !hasChanges}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  setDisplayName(profile.display_name || '');
                  setStatus(null);
                }}
                disabled={isSaving || !hasChanges}
              >
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avatar Edit Modal */}
      <AvatarEditModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatarUrl={profile.avatar_url}
        onUploadSuccess={handleAvatarUploadSuccess}
        onUploadError={handleAvatarUploadError}
        onDelete={handleDeleteAvatar}
      />

      {/* Linked Accounts - Only show Algorand/Voi accounts */}
      <Card id="accounts">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-warning-500 dark:text-warning-400 uppercase">Your Accounts</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Only display Algorand (Voi) accounts - hide Base wallets */}
          {initialData.accounts
            .filter((account) => account.chain === 'voi')
            .map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 border-2 border-warning-300 dark:border-warning-500/30 rounded-lg bg-warning-50 dark:bg-warning-500/5"
              >
                <div className="flex items-center gap-4 flex-1">
                  <ChainBadge chain={account.chain} />
                  <div className="flex-1">
                    <div className="font-mono text-sm text-neutral-700 dark:text-neutral-300">{account.address}</div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-500 mt-1">
                      {account.wallet_provider === 'coinbase-embedded'
                        ? 'From Coinbase Wallet'
                        : 'External Wallet'}
                      {account.is_primary && ' • Primary'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleCopyAddress(account.address)}
                  className="px-4 py-2 text-sm border border-warning-300 dark:border-warning-500/30 text-warning-600 dark:text-warning-400 rounded hover:bg-warning-50 dark:hover:bg-warning-500/10 transition-colors font-semibold"
                >
                  Copy Address
                </button>
              </div>
            ))}

        </CardContent>
      </Card>

      {/* Referral Section */}
      <Card id="referrals">
        <CardHeader>
          <h2 className="text-2xl font-bold text-warning-500 dark:text-warning-400 uppercase">Your Referral Code</h2>
        </CardHeader>
        <CardContent>
          {loadingReferrals ? (
            <p className="text-neutral-600 dark:text-neutral-400">Loading referral information...</p>
          ) : referralStats ? (
            <div className="space-y-6">
              {/* Referral Code Display */}
              <div className="text-center p-6 bg-gradient-to-r from-primary-100 dark:from-primary-600/10 to-accent-100 dark:to-accent-600/10 border-2 border-primary-300 dark:border-primary-500/30 rounded-xl">
                <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-2">Your Unique Referral Code</p>
                <div className="inline-block px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 rounded-lg">
                  <span className="text-3xl font-black text-white font-mono tracking-wider">
                    {referralStats.referralCode}
                  </span>
                </div>
                <p className="text-neutral-600 dark:text-neutral-500 text-xs mt-3 font-mono">
                  {window.location.origin}/r/{referralStats.referralCode}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-success-100 dark:bg-success-500/10 border border-success-300 dark:border-success-500/30 rounded-lg">
                  <div className="text-2xl font-black text-success-600 dark:text-success-400">
                    {referralStats.activeReferrals}
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">Active</p>
                </div>
                <div className="text-center p-4 bg-warning-100 dark:bg-warning-500/10 border border-warning-300 dark:border-warning-500/30 rounded-lg">
                  <div className="text-2xl font-black text-warning-600 dark:text-warning-400">
                    {referralStats.queuedReferrals}
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">Queued</p>
                </div>
                <div className="text-center p-4 bg-warning-100 dark:bg-warning-500/10 border border-warning-300 dark:border-warning-500/30 rounded-lg">
                  <div className="text-2xl font-black text-warning-600 dark:text-warning-400">
                    {referralStats.totalReferrals}
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">Total</p>
                </div>
              </div>

              {/* Capacity Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Referral Capacity</span>
                  <span className="text-warning-500 dark:text-warning-400 font-bold">
                    {referralStats.activeReferrals} / {referralStats.maxReferrals}
                  </span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-500"
                    style={{
                      width: `${(referralStats.activeReferrals / referralStats.maxReferrals) * 100}%`,
                    }}
                  />
                </div>
                {referralStats.queuedReferrals > 0 && (
                  <p className="text-sm text-warning-600 dark:text-warning-400">
                    💡 {referralStats.queuedReferrals} referral
                    {referralStats.queuedReferrals !== 1 ? 's' : ''} waiting in queue
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleCopyReferralCode}
                  className="flex-1"
                >
                  <div className="flex items-center gap-2 justify-center">
                    <TicketIcon size={20} />
                    <span>Copy Referral Link</span>
                  </div>
                </Button>
                <a href="/app/referrals" className="flex-1">
                  <Button variant="secondary" size="md" className="w-full">
                    View Full Details
                  </Button>
                </a>
              </div>
            </div>
          ) : (
            <p className="text-error-600 dark:text-error-400">Failed to load referral information</p>
          )}
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-warning-500 dark:text-warning-400 uppercase">Account Actions</h2>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button variant="ghost" size="md" onClick={handleLogout}>
              Sign Out
            </Button>
            <button className="px-6 py-3 border-2 border-error-300 dark:border-error-500/30 text-error-600 dark:text-error-400 rounded-xl font-bold uppercase tracking-wide hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors">
              Delete Account
            </button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
