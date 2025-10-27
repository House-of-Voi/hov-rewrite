'use client';

import { useState, useEffect } from 'react';
import type { ReferralCodeItem, PaginatedResponse, ReferralStats } from '@/lib/types/admin';

export default function ReferralsTable() {
  const [referrals, setReferrals] = useState<ReferralCodeItem[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    total_pages: 0,
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchReferrals();
    fetchStats();
  }, [pagination.page, statusFilter]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/referrals?stats_only=true');
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching referral stats:', err);
    }
  };

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/admin/referrals?${params}`);
      const data = await response.json();

      if (data.success) {
        const result = data.data as PaginatedResponse<ReferralCodeItem>;
        setReferrals(result.data);
        setPagination(result.pagination);
      } else {
        setError(data.error || 'Failed to fetch referrals');
      }
    } catch (err) {
      console.error('Error fetching referrals:', err);
      setError('Failed to load referrals');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (referral: ReferralCodeItem) => {
    if (referral.deactivated_at) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700">
          Deactivated
        </span>
      );
    }
    if (referral.converted_at) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-success-100 dark:bg-success-900/30 text-success-800 dark:text-success-400 border border-success-300 dark:border-success-700">
          Converted
        </span>
      );
    }
    if (referral.attributed_at) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-warning-100 dark:bg-warning-900/30 text-warning-800 dark:text-warning-400 border border-warning-300 dark:border-warning-700">
          Pending
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-400 border border-primary-300 dark:border-primary-700">
        Active
      </span>
    );
  };

  if (error) {
    return (
      <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4 text-error-800 dark:text-error-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Total Codes</div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{stats.total_codes}</div>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Active</div>
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{stats.active_codes}</div>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Pending</div>
            <div className="text-2xl font-bold text-warning-600 dark:text-warning-400">{stats.pending_codes}</div>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Converted</div>
            <div className="text-2xl font-bold text-success-600 dark:text-success-400">{stats.converted_codes}</div>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Conversion Rate</div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{stats.conversion_rate.toFixed(1)}%</div>
          </div>
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Credits Distributed</div>
            <div className="text-2xl font-bold text-accent-600 dark:text-accent-400">{parseFloat(stats.total_credits_distributed).toFixed(2)}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="converted">Converted</option>
              <option value="deactivated">Deactivated</option>
            </select>
          </div>
          <div className="md:col-span-2 flex items-center justify-end">
            <button
              onClick={fetchReferrals}
              className="px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors font-medium"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">Loading referrals...</div>
        ) : referrals.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">No referrals found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                <thead className="bg-neutral-50 dark:bg-neutral-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                      Referrer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                      Referred User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                      Plays
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                  {referrals.map((referral) => (
                    <tr key={referral.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="px-2 py-1 text-sm font-mono bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded">
                          {referral.code}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {referral.referrer_display_name || 'No name'}
                          </div>
                          <div className="text-sm text-neutral-500 dark:text-neutral-400">{referral.referrer_email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {referral.referred_profile_id ? (
                          <div>
                            <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                              {referral.referred_display_name || 'No name'}
                            </div>
                            <div className="text-sm text-neutral-500 dark:text-neutral-400">{referral.referred_email}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-neutral-400 dark:text-neutral-500">Not used yet</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(referral)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
                        {referral.referred_user_plays || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
                        {new Date(referral.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} referrals
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300">
                  Page {pagination.page} of {pagination.total_pages}
                </span>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page >= pagination.total_pages}
                  className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
