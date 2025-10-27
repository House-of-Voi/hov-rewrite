'use client';
import { useState } from 'react';
import Card, { CardContent, CardHeader } from '@/components/Card';
import Button from '@/components/Button';

interface WaitlistUser {
  id: string;
  primary_email: string;
  display_name: string | null;
  waitlist_position: number | null;
  waitlist_joined_at: string | null;
  game_access_granted: boolean;
  created_at: string;
  referral: {
    isActive: boolean;
    referrerName: string;
  } | null;
}

interface WaitlistAdminClientProps {
  waitlistUsers: WaitlistUser[];
  approvedCount: number;
}

export default function WaitlistAdminClient({
  waitlistUsers,
  approvedCount,
}: WaitlistAdminClientProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleGrantAccess = async (profileId: string, email: string) => {
    setLoading(profileId);
    setStatus(null);

    try {
      const response = await fetch('/api/admin/grant-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Failed to grant access');
      }

      setStatus({ type: 'success', message: `Access granted to ${email}. Refreshing...` });

      // Refresh the page to show updated list
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Grant access error:', error);
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to grant access',
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-warning-500 dark:text-warning-400 neon-text uppercase">
            Waitlist Management
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2">
            Approve users for game access
          </p>
        </div>
        <a href="/admin">
          <Button variant="ghost" size="sm">
            ← Back to Admin
          </Button>
        </a>
      </div>

      {/* Status Banner */}
      {status && (
        <div
          className={`p-6 rounded-xl text-center font-semibold text-lg ${
            status.type === 'success'
              ? 'bg-success-100 dark:bg-success-500/20 text-success-600 dark:text-success-400 border-2 border-success-300 dark:border-success-500/30'
              : 'bg-error-100 dark:bg-error-500/20 text-error-600 dark:text-error-400 border-2 border-error-300 dark:border-error-500/30'
          }`}
        >
          {status.message}
        </div>
      )}

      {/* Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card glow>
          <CardContent className="p-8 text-center">
            <div className="text-5xl font-black text-warning-500 dark:text-warning-400 mb-2">
              {waitlistUsers.length}
            </div>
            <div className="text-neutral-600 dark:text-neutral-400 uppercase tracking-wider text-sm">
              On Waitlist
            </div>
          </CardContent>
        </Card>

        <Card glow>
          <CardContent className="p-8 text-center">
            <div className="text-5xl font-black text-success-600 dark:text-success-400 mb-2">
              {approvedCount}
            </div>
            <div className="text-neutral-600 dark:text-neutral-400 uppercase tracking-wider text-sm">
              Approved Users
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Waitlist Table */}
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-warning-500 dark:text-warning-400 uppercase">Pending Approval</h2>
        </CardHeader>
        <CardContent>
          {waitlistUsers.length === 0 ? (
            <div className="text-center py-12 text-neutral-600 dark:text-neutral-500">
              No users on waitlist
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-warning-200 dark:border-warning-900/20">
                    <th className="text-left py-3 px-4 text-neutral-600 dark:text-neutral-400 font-semibold uppercase text-sm">
                      User
                    </th>
                    <th className="text-left py-3 px-4 text-neutral-600 dark:text-neutral-400 font-semibold uppercase text-sm">
                      Joined
                    </th>
                    <th className="text-left py-3 px-4 text-neutral-600 dark:text-neutral-400 font-semibold uppercase text-sm">
                      Referral
                    </th>
                    <th className="text-left py-3 px-4 text-neutral-600 dark:text-neutral-400 font-semibold uppercase text-sm">
                      Position
                    </th>
                    <th className="text-right py-3 px-4 text-neutral-600 dark:text-neutral-400 font-semibold uppercase text-sm">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {waitlistUsers.map((user) => (
                    <tr key={user.id} className="border-b border-warning-200/20 dark:border-warning-900/10 hover:bg-warning-50 dark:hover:bg-warning-500/5">
                      <td className="py-4 px-4">
                        <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                          {user.display_name || user.primary_email}
                        </div>
                        {user.display_name && (
                          <div className="text-sm text-neutral-600 dark:text-neutral-500">{user.primary_email}</div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-neutral-600 dark:text-neutral-400">
                        {user.waitlist_joined_at
                          ? new Date(user.waitlist_joined_at).toLocaleDateString()
                          : new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        {user.referral ? (
                          <div>
                            <div className="text-sm text-neutral-700 dark:text-neutral-300">{user.referral.referrerName}</div>
                            <div
                              className={`text-xs mt-1 ${
                                user.referral.isActive ? 'text-success-600 dark:text-success-400' : 'text-warning-600 dark:text-warning-400'
                              }`}
                            >
                              {user.referral.isActive ? 'Active' : 'Inactive'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-neutral-600 dark:text-neutral-500">No referral</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-neutral-600 dark:text-neutral-400">
                        {user.waitlist_position || '—'}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleGrantAccess(user.id, user.primary_email)}
                          disabled={loading === user.id}
                          loading={loading === user.id}
                        >
                          Grant Access
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
