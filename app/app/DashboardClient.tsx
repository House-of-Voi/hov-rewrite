'use client';

import { useState, useEffect } from 'react';
import { useSignOut } from '@coinbase/cdp-hooks';
import Card, { CardContent, CardHeader } from '@/components/Card';
import Button from '@/components/Button';
import Avatar from '@/components/Avatar';
import AvatarEditModal from '@/components/AvatarEditModal';
import ProfileEditModal from '@/components/ProfileEditModal';
import BalancesCard from '@/components/BalancesCard';
import { TicketIcon, CopyIcon, EditIcon, ExternalLinkIcon } from '@/components/icons';
import { truncateAddress } from '@/lib/utils/format';
import type { ProfileWithAccounts } from '@/lib/profile/data';

interface DashboardClientProps {
  initialData: ProfileWithAccounts;
}

interface ReferralStats {
  referralCode: string;
  activeReferrals: number;
  maxReferrals: number;
  queuedReferrals: number;
  totalReferrals: number;
}

export default function DashboardClient({ initialData }: DashboardClientProps) {
  const [profile, setProfile] = useState(initialData.profile);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [loadingReferrals, setLoadingReferrals] = useState(true);

  const { signOut } = useSignOut();

  // Get primary Voi address
  const primaryVoiAccount = initialData.accounts.find((account) => account.chain === 'voi' && account.is_primary) 
    || initialData.accounts.find((account) => account.chain === 'voi');

  const handleSaveProfile = async (displayName: string) => {
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
      setTimeout(() => setStatus(null), 3000);
    } else {
      throw new Error(result.error || 'Failed to update profile');
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

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-4xl font-black text-gold-400 neon-text uppercase">Dashboard</h1>
        <p className="text-neutral-400 mt-2">
          Welcome back! Manage your profile, wallets, and referrals.
        </p>
      </div>

      {/* Status Message */}
      {status && (
        <div
          className={`p-4 rounded-xl text-center font-semibold ${
            status.type === 'success'
              ? 'bg-green-500/20 text-green-400 border-2 border-green-500/30'
              : 'bg-ruby-500/20 text-ruby-400 border-2 border-ruby-500/30'
          }`}
        >
          {status.message}
        </div>
      )}

      {/* Profile Hero Section */}
      <Card>
        <CardContent className="p-8">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <Avatar
                src={profile.avatar_url}
                displayName={profile.display_name}
                alt={profile.display_name || profile.primary_email}
                size="xl"
                editable
                onEditClick={() => setIsAvatarModalOpen(true)}
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-3xl font-black text-gold-400 uppercase">
                    {profile.display_name || 'No name set'}
                  </h2>
                  <p className="text-neutral-400 text-sm mt-1">{profile.primary_email}</p>
                  
                  {/* Primary Address */}
                  {primaryVoiAccount && (
                    <div className="mt-3 flex items-center gap-2 text-neutral-300">
                      <a
                        href={`https://block.voi.network/explorer/account/${primaryVoiAccount.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-sm hover:text-gold-400 transition-colors flex items-center gap-1"
                      >
                        {truncateAddress(primaryVoiAccount.address)}
                        <ExternalLinkIcon size={14} className="text-neutral-500" />
                      </a>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(primaryVoiAccount.address);
                          setStatus({ type: 'success', message: 'Address copied!' });
                          setTimeout(() => setStatus(null), 2000);
                        }}
                        className="p-1 hover:bg-gold-500/10 rounded transition-colors"
                        title="Copy address"
                      >
                        <CopyIcon size={14} className="text-gold-400" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Edit Button */}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsProfileEditModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <EditIcon size={16} />
                  <span>Edit Profile</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <AvatarEditModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatarUrl={profile.avatar_url}
        onUploadSuccess={handleAvatarUploadSuccess}
        onUploadError={handleAvatarUploadError}
        onDelete={handleDeleteAvatar}
      />

      <ProfileEditModal
        isOpen={isProfileEditModalOpen}
        onClose={() => setIsProfileEditModalOpen(false)}
        currentDisplayName={profile.display_name}
        email={profile.primary_email}
        onSave={handleSaveProfile}
      />

      {/* Unified Balances Card */}
      {primaryVoiAccount && (
        <BalancesCard address={primaryVoiAccount.address} />
      )}

      {/* Referral Section */}
      <Card id="referrals">
        <CardHeader>
          <h2 className="text-2xl font-bold text-gold-400 uppercase">Your Referral Code</h2>
        </CardHeader>
        <CardContent>
          {loadingReferrals ? (
            <p className="text-neutral-400">Loading referral information...</p>
          ) : referralStats ? (
            <div className="space-y-6">
              {/* Referral Code Display */}
              <div className="text-center p-6 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-2 border-blue-500/30 rounded-xl">
                <p className="text-neutral-400 text-sm mb-2">Your Unique Referral Code</p>
                <div className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                  <span className="text-3xl font-black text-white font-mono tracking-wider">
                    {referralStats.referralCode}
                  </span>
                </div>
                <p className="text-neutral-500 text-xs mt-3 font-mono">
                  {window.location.origin}/r/{referralStats.referralCode}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="text-2xl font-black text-green-400">
                    {referralStats.activeReferrals}
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">Active</p>
                </div>
                <div className="text-center p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="text-2xl font-black text-yellow-400">
                    {referralStats.queuedReferrals}
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">Queued</p>
                </div>
                <div className="text-center p-4 bg-gold-500/10 border border-gold-500/30 rounded-lg">
                  <div className="text-2xl font-black text-gold-400">
                    {referralStats.totalReferrals}
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">Total</p>
                </div>
              </div>

              {/* Capacity Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Referral Capacity</span>
                  <span className="text-gold-400 font-bold">
                    {referralStats.activeReferrals} / {referralStats.maxReferrals}
                  </span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                    style={{
                      width: `${(referralStats.activeReferrals / referralStats.maxReferrals) * 100}%`,
                    }}
                  />
                </div>
                {referralStats.queuedReferrals > 0 && (
                  <p className="text-sm text-yellow-400">
                    {referralStats.queuedReferrals} referral
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
            <p className="text-ruby-400">Failed to load referral information</p>
          )}
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-gold-400 uppercase">Account Actions</h2>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button variant="ghost" size="md" onClick={handleLogout}>
              Sign Out
            </Button>
            <button className="px-6 py-3 border-2 border-ruby-500/30 text-ruby-400 rounded-xl font-bold uppercase tracking-wide hover:bg-ruby-500/10 transition-colors">
              Delete Account
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
