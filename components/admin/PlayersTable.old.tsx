'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { PlayerListItem, PaginatedResponse } from '@/lib/types/admin';

export default function PlayersTable() {
  const [players, setPlayers] = useState<PlayerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    total_pages: 0,
  });

  // Filters
  const [search, setSearch] = useState('');
  const [gameAccessFilter, setGameAccessFilter] = useState<string>('all');
  const [waitlistFilter, setWaitlistFilter] = useState<string>('all');
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());

  const fetchPlayers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (search) params.append('search', search);
      if (gameAccessFilter !== 'all') params.append('game_access', gameAccessFilter);
      if (waitlistFilter !== 'all') params.append('on_waitlist', waitlistFilter);

      const response = await fetch(`/api/admin/players?${params}`);
      const data = await response.json();

      if (data.success) {
        const result = data.data as PaginatedResponse<PlayerListItem>;
        setPlayers(result.data);
        setPagination(result.pagination);
      } else {
        setError(data.error || 'Failed to fetch players');
      }
    } catch (err) {
      console.error('Error fetching players:', err);
      setError('Failed to load players');
    } finally {
      setLoading(false);
    }
  }, [gameAccessFilter, pagination.limit, pagination.page, search, waitlistFilter]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const handleBulkAction = async (action: string) => {
    if (selectedPlayers.size === 0) {
      alert('No players selected');
      return;
    }

    const playerIds = Array.from(selectedPlayers);

    try {
      const response = await fetch(`/api/admin/players/bulk?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_ids: playerIds }),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        setSelectedPlayers(new Set());
        fetchPlayers();
      } else {
        alert(data.error || 'Action failed');
      }
    } catch (err) {
      console.error('Bulk action error:', err);
      alert('Failed to perform bulk action');
    }
  };

  const togglePlayerSelection = (playerId: string) => {
    const newSelection = new Set(selectedPlayers);
    if (newSelection.has(playerId)) {
      newSelection.delete(playerId);
    } else {
      newSelection.add(playerId);
    }
    setSelectedPlayers(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedPlayers.size === players.length) {
      setSelectedPlayers(new Set());
    } else {
      setSelectedPlayers(new Set(players.map(p => p.id)));
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search by email or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={gameAccessFilter}
              onChange={(e) => setGameAccessFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Players</option>
              <option value="true">Has Access</option>
              <option value="false">No Access</option>
            </select>
          </div>
          <div>
            <select
              value={waitlistFilter}
              onChange={(e) => setWaitlistFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="true">On Waitlist</option>
              <option value="false">Not on Waitlist</option>
            </select>
          </div>
          <div className="flex items-center justify-end">
            <button
              onClick={fetchPlayers}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedPlayers.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-blue-900 font-medium">
            {selectedPlayers.size} player(s) selected
          </span>
          <div className="space-x-2">
            <button
              onClick={() => handleBulkAction('grant-access')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Grant Access
            </button>
            <button
              onClick={() => handleBulkAction('revoke-access')}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Revoke Access
            </button>
            <button
              onClick={() => setSelectedPlayers(new Set())}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading players...</div>
        ) : players.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No players found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedPlayers.size === players.length && players.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Player
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Accounts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Access
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {players.map((player) => (
                    <tr key={player.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedPlayers.has(player.id)}
                          onChange={() => togglePlayerSelection(player.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">
                            {player.display_name || 'No name'}
                          </div>
                          <div className="text-sm text-gray-500">{player.primary_email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {player.accounts.map((account, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-800">
                                {account.chain}
                              </span>
                              <span className="text-xs text-gray-600 font-mono">
                                {account.address.slice(0, 6)}...{account.address.slice(-4)}
                              </span>
                              {account.is_primary && (
                                <span className="text-xs text-blue-600">★</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {player.game_access_granted ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Granted
                          </span>
                        ) : player.waitlist_position !== null ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Waitlist #{player.waitlist_position}
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            No Access
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{player.total_plays || 0} plays</div>
                        <div className="text-xs">{player.total_wagered || '0'} wagered</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(player.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/admin/players/${player.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </Link>
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
                {pagination.total} players
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
