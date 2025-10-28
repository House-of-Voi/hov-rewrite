'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSignOut } from '@coinbase/cdp-hooks';
import Card, { CardContent, CardHeader } from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Avatar from '@/components/Avatar';
import AvatarEditModal from '@/components/AvatarEditModal';
import ProfileEditModal from '@/components/ProfileEditModal';
import ReferralCodesModal from '@/components/ReferralCodesModal';
import BalancesCard from '@/components/BalancesCard';
import { TicketIcon, CopyIcon, EditIcon, ExternalLinkIcon } from '@/components/icons';
import { truncateAddress } from '@/lib/utils/format';
import type { ProfileWithAccounts } from '@/lib/profile/data';

interface DashboardClientProps {
  initialData: ProfileWithAccounts;
  isActivated: boolean;
}

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

export default function DashboardClient({ initialData, isActivated }: DashboardClientProps) {
  const [profile, setProfile] = useState(initialData.profile);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false);
  const [isReferralCodesModalOpen, setIsReferralCodesModalOpen] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [referralCode, setReferralCode] = useState('');
  const [isLinkingReferral, setIsLinkingReferral] = useState(false);

  const { signOut } = useSignOut();

  // Get primary Voi address
  const primaryVoiAccount = initialData.accounts.find((account) => account.chain === 'voi' && account.is_primary)
    || initialData.accounts.find((account) => account.chain === 'voi');

  // Use React Query for referral stats with caching and automatic refetching
  const { data: referralStats, isLoading: loadingReferrals, refetch: refetchReferralStats } = useQuery<ReferralStats>({
    queryKey: ['referralStats'],
    queryFn: async () => {
      const response = await fetch('/api/referrals/info');
      const data = await response.json();

      if (!data.ok) {
        throw new Error('Failed to fetch referral stats');
      }

      return {
        codesGenerated: data.codesGenerated,
        codesAvailable: data.codesAvailable,
        maxReferrals: data.maxReferrals,
        activeReferrals: data.activeReferrals,
        queuedReferrals: data.queuedReferrals,
        totalReferrals: data.totalReferrals,
        codes: data.codes,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for referral stats
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  const handleReferralCodesModalClose = () => {
    setIsReferralCodesModalOpen(false);
    // Refetch stats when modal closes to show any updates
    refetchReferralStats();
  };

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

  // Logout is now handled by UserNav component
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const handleLinkReferralCode = async () => {
    if (!referralCode || referralCode.length !== 7) {
      setStatus({ type: 'error', message: 'Please enter a valid 7-character referral code' });
      return;
    }

    setIsLinkingReferral(true);
    setStatus(null);

    try {
      const response = await fetch('/api/profile/link-referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode: referralCode.toUpperCase() }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setStatus({ type: 'error', message: result.error || 'Failed to link referral code' });
        setIsLinkingReferral(false);
        return;
      }

      setStatus({ type: 'success', message: 'Referral code activated! Refreshing...' });

      // Refresh the page to show activated state
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Link referral error:', error);
      setStatus({ type: 'error', message: 'Failed to link referral code. Please try again.' });
      setIsLinkingReferral(false);
    }
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

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold text-neutral-950 dark:text-white">Welcome Back</h1>
          <p className="text-neutral-700 dark:text-neutral-300 mt-2">
            Manage your profile, wallets, and referrals.
          </p>
        </div>
      </div>

      {/* Status Message */}
      {status && (
        <div
          className={`p-4 rounded-xl text-center font-medium ${
            status.type === 'success'
              ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300 border border-success-300 dark:border-success-700'
              : 'bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-300 border border-error-300 dark:border-error-700'
          }`}
        >
          {status.message}
        </div>
      )}

      {/* Waitlist/Activation Alert - Show if user is not activated */}
      {!isActivated && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center">
                  <span className="text-2xl">⏳</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-neutral-950 dark:text-white mb-2">
                    Account Not Yet Activated
                  </h3>
                  <p className="text-neutral-700 dark:text-neutral-300 mb-4">
                    Enter a referral code to activate your account and access all features.
                  </p>

                  <div className="flex gap-3">
                    <Input
                      type="text"
                      value={referralCode}
                      onChange={(e) => {
                        setReferralCode(e.target.value.toUpperCase());
                        setStatus(null);
                      }}
                      placeholder="Enter 7-character code"
                      maxLength={7}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && referralCode.length === 7) {
                          handleLinkReferralCode();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleLinkReferralCode}
                      disabled={isLinkingReferral || referralCode.length !== 7}
                    >
                      {isLinkingReferral ? 'Activating...' : 'Activate'}
                    </Button>
                  </div>

                  {referralCode && referralCode.length !== 7 && (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
                      {7 - referralCode.length} character{7 - referralCode.length !== 1 ? 's' : ''} remaining
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
                  <h2 className="text-2xl font-semibold text-neutral-950 dark:text-white">
                    {profile.display_name || 'Set your name'}
                  </h2>
                  <p className="text-neutral-700 dark:text-neutral-300 text-sm mt-1">{profile.primary_email}</p>

                  {/* Primary Address */}
                  {primaryVoiAccount && (
                    <div className="mt-3 flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                      <a
                        href={`https://block.voi.network/explorer/account/${primaryVoiAccount.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-sm hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1"
                      >
                        {truncateAddress(primaryVoiAccount.address)}
                        <ExternalLinkIcon size={14} className="text-neutral-500 dark:text-neutral-400" />
                      </a>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(primaryVoiAccount.address);
                          setStatus({ type: 'success', message: 'Address copied!' });
                          setTimeout(() => setStatus(null), 2000);
                        }}
                        className="p-1 hover:bg-primary-50 dark:hover:bg-primary-950 rounded transition-colors"
                        title="Copy address"
                      >
                        <CopyIcon size={14} className="text-primary-600 dark:text-primary-400" />
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

      <ReferralCodesModal
        isOpen={isReferralCodesModalOpen}
        onClose={handleReferralCodesModalClose}
      />

      {/* Unified Balances Card */}
      {primaryVoiAccount && (
        <BalancesCard address={primaryVoiAccount.address} />
      )}

      {/* Referral Section - Only show if user has referral slots */}
      {profile.max_referrals > 0 && (
        <Card id="referrals">
          <CardHeader>
            <h2 className="text-xl font-semibold text-neutral-950 dark:text-white">Your Referral Codes</h2>
          </CardHeader>
          <CardContent>
            {loadingReferrals ? (
              <p className="text-neutral-700 dark:text-neutral-300">Loading referral information...</p>
            ) : referralStats ? (
            <div className="space-y-6">
              {/* Referral Codes Summary */}
              <div className="text-center p-6 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-950/30 dark:to-accent-950/30 border border-primary-200 dark:border-primary-800 rounded-xl">
                <p className="text-neutral-700 dark:text-neutral-300 text-sm mb-2">Generated Codes</p>
                <div className="flex justify-center items-baseline gap-2">
                  <span className="text-3xl font-semibold text-neutral-950 dark:text-white">
                    {referralStats.codesGenerated}
                  </span>
                  <span className="text-xl text-neutral-700 dark:text-neutral-300">/ {referralStats.maxReferrals}</span>
                </div>
                <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-3">
                  {referralStats.codesAvailable > 0 ? (
                    <>You can create {referralStats.codesAvailable} more code{referralStats.codesAvailable !== 1 ? 's' : ''}</>
                  ) : (
                    <>All referral slots used</>
                  )}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-success-100 dark:bg-success-900/20 border border-success-300 dark:border-success-700 rounded-lg">
                  <div className="text-2xl font-semibold text-success-700 dark:text-success-300">
                    {referralStats.activeReferrals}
                  </div>
                  <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-1">Active</p>
                </div>
                <div className="text-center p-4 bg-warning-100 dark:bg-warning-900/20 border border-warning-300 dark:border-warning-700 rounded-lg">
                  <div className="text-2xl font-semibold text-warning-700 dark:text-warning-300">
                    {referralStats.queuedReferrals}
                  </div>
                  <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-1">Queued</p>
                </div>
                <div className="text-center p-4 bg-primary-100 dark:bg-primary-900/20 border border-primary-300 dark:border-primary-700 rounded-lg">
                  <div className="text-2xl font-semibold text-primary-700 dark:text-primary-300">
                    {referralStats.totalReferrals}
                  </div>
                  <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-1">Total</p>
                </div>
              </div>

              {/* Capacity Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-700 dark:text-neutral-300">Referral Capacity</span>
                  <span className="text-neutral-950 dark:text-white font-semibold">
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
                    {referralStats.queuedReferrals} referral
                    {referralStats.queuedReferrals !== 1 ? 's' : ''} waiting in queue
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-center">
                <Button
                  variant="primary"
                  size="md"
                  className="px-8"
                  onClick={() => setIsReferralCodesModalOpen(true)}
                >
                  <div className="flex items-center gap-2 justify-center">
                    <TicketIcon size={20} />
                    <span>Manage Referral Codes</span>
                  </div>
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-error-600 dark:text-error-400">Failed to load referral information</p>
          )}
        </CardContent>
        </Card>
      )}

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-neutral-950 dark:text-white">Account Actions</h2>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end">
            <button className="px-6 py-3 border-2 border-error-300 dark:border-error-700 text-error-600 dark:text-error-400 rounded-xl font-medium hover:bg-error-50 dark:hover:bg-error-950 transition-colors">
              Delete Account
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
