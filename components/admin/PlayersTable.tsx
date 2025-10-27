'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Card, { CardContent } from '@/components/Card';
import ChainBadge from '@/components/ChainBadge';
import type { PlayerListItem, PaginatedResponse } from '@/lib/types/admin';
import { formatNumberCompact } from '@/lib/utils/format';

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

  const [search, setSearch] = useState('');
  const [gameAccessFilter, setGameAccessFilter] = useState<string>('all');
  const [waitlistFilter, setWaitlistFilter] = useState<string>('all');
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPlayers();
  }, [pagination.page, search, gameAccessFilter, waitlistFilter]);

  const fetchPlayers = async () => {
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
  };

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
      <Card>
        <CardContent>
          <div className="text-ruby-400 p-4">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search by email or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
            />
            <select
              value={gameAccessFilter}
              onChange={(e) => setGameAccessFilter(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
            >
              <option value="all">All Players</option>
              <option value="true">Has Access</option>
              <option value="false">No Access</option>
            </select>
            <select
              value={waitlistFilter}
              onChange={(e) => setWaitlistFilter(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
            >
              <option value="all">All Status</option>
              <option value="true">On Waitlist</option>
              <option value="false">Not on Waitlist</option>
            </select>
            <button
              onClick={fetchPlayers}
              className="px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg font-bold uppercase tracking-wide hover:bg-primary-700 dark:hover:bg-primary-600 transition-all"
            >
              Refresh
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedPlayers.size > 0 && (
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-primary-600 dark:text-primary-400 font-bold">
                {selectedPlayers.size} player(s) selected
              </span>
              <div className="space-x-2">
                <button
                  onClick={() => handleBulkAction('grant-access')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
                >
                  Grant Access
                </button>
                <button
                  onClick={() => handleBulkAction('revoke-access')}
                  className="px-4 py-2 bg-ruby-600 text-white rounded-lg font-bold hover:bg-ruby-700"
                >
                  Revoke
                </button>
                <button
                  onClick={() => setSelectedPlayers(new Set())}
                  className="px-4 py-2 bg-neutral-700 text-white rounded-lg font-bold hover:bg-neutral-600"
                >
                  Clear
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent>
          {loading ? (
            <div className="p-8 text-center text-neutral-500">Loading players...</div>
          ) : players.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">No players found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="border-b border-neutral-200 dark:border-neutral-700">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedPlayers.size === players.length && players.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-neutral-300 dark:border-neutral-700"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                        Player
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                        Accounts
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                        Access
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                        Stats
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                    {players.map((player) => (
                      <tr key={player.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedPlayers.has(player.id)}
                            onChange={() => togglePlayerSelection(player.id)}
                            className="rounded border-neutral-300 dark:border-neutral-700"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-bold text-neutral-200">
                              {player.display_name || 'No name'}
                            </div>
                            <div className="text-sm text-neutral-500">{player.primary_email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {player.accounts.map((account, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <ChainBadge chain={account.chain as 'base' | 'voi' | 'solana'} />
                                <span className="text-xs text-neutral-400 font-mono">
                                  {account.address.slice(0, 6)}...{account.address.slice(-4)}
                                </span>
                                {account.is_primary && (
                                  <span className="text-xs text-primary-600 dark:text-primary-400">★</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {player.game_access_granted ? (
                            <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                              GRANTED
                            </span>
                          ) : player.waitlist_position !== null ? (
                            <span className="px-2 py-1 text-xs font-bold rounded-full bg-warning-100 dark:bg-warning-900/30 text-warning-800 dark:text-warning-400 border border-warning-300 dark:border-warning-700">
                              WAITLIST #{player.waitlist_position}
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-bold rounded-full bg-neutral-700/50 text-neutral-400 border border-neutral-600/30">
                              NO ACCESS
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-400">
                          <div>{player.total_plays || 0} plays</div>
                          <div className="text-xs">{formatNumberCompact(parseFloat(player.total_wagered || '0'))} wagered</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/admin/players/${player.id}`}
                            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-bold text-sm uppercase tracking-wide"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                <div className="text-sm text-neutral-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} players
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-primary-600 dark:hover:text-primary-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase tracking-wide"
                  >
                    Prev
                  </button>
                  <span className="px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300">
                    Page {pagination.page} of {pagination.total_pages}
                  </span>
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page >= pagination.total_pages}
                    className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-primary-600 dark:hover:text-primary-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase tracking-wide"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
