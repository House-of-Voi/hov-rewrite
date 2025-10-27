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
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          Deactivated
        </span>
      );
    }
    if (referral.converted_at) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          Converted
        </span>
      );
    }
    if (referral.attributed_at) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
          Pending
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
        Active
      </span>
    );
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Total Codes</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total_codes}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Active</div>
            <div className="text-2xl font-bold text-blue-600">{stats.active_codes}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending_codes}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Converted</div>
            <div className="text-2xl font-bold text-green-600">{stats.converted_codes}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Conversion Rate</div>
            <div className="text-2xl font-bold text-gray-900">{stats.conversion_rate.toFixed(1)}%</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Credits Distributed</div>
            <div className="text-2xl font-bold text-purple-600">{parseFloat(stats.total_credits_distributed).toFixed(2)}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading referrals...</div>
        ) : referrals.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No referrals found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Referrer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Referred User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plays
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {referrals.map((referral) => (
                    <tr key={referral.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="px-2 py-1 text-sm font-mono bg-gray-100 text-gray-800 rounded">
                          {referral.code}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {referral.referrer_display_name || 'No name'}
                          </div>
                          <div className="text-sm text-gray-500">{referral.referrer_email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {referral.referred_profile_id ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {referral.referred_display_name || 'No name'}
                            </div>
                            <div className="text-sm text-gray-500">{referral.referred_email}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not used yet</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(referral)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {referral.referred_user_plays || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(referral.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} referrals
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-gray-700">
                  Page {pagination.page} of {pagination.total_pages}
                </span>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page >= pagination.total_pages}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
