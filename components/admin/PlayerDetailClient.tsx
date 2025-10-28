'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PlayerDetail } from '@/lib/types/admin';
import { formatNumberCompact } from '@/lib/utils/format';

interface PlayerDetailClientProps {
  playerId: string;
}

export default function PlayerDetailClient({ playerId }: PlayerDetailClientProps) {
  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<PlayerDetail>>({});

  const fetchPlayer = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/players/${playerId}`);
      const data = await response.json();

      if (data.success) {
        setPlayer(data.data);
        setEditForm(data.data);
      } else {
        setError(data.error || 'Failed to fetch player');
      }
    } catch (err) {
      console.error('Error fetching player:', err);
      setError('Failed to load player');
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    fetchPlayer();
  }, [fetchPlayer]);

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/admin/players/${playerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: editForm.display_name,
          primary_email: editForm.primary_email,
          max_referrals: editForm.max_referrals,
          game_access_granted: editForm.game_access_granted,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Player updated successfully');
        setEditing(false);
        fetchPlayer();
      } else {
        alert(data.error || 'Failed to update player');
      }
    } catch (err) {
      console.error('Error updating player:', err);
      alert('Failed to update player');
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-8 text-center">
        <div className="text-neutral-500 dark:text-neutral-400">Loading player details...</div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4 text-error-800 dark:text-error-400">
        {error || 'Player not found'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Profile Information</h2>
          {editing ? (
            <div className="space-x-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-success-600 dark:bg-success-500 text-white rounded-lg hover:bg-success-700 dark:hover:bg-success-600 transition-colors font-medium"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setEditForm(player);
                }}
                className="px-4 py-2 bg-neutral-600 dark:bg-neutral-700 text-white rounded-lg hover:bg-neutral-700 dark:hover:bg-neutral-600 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors font-medium"
            >
              Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="display-name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Display Name</label>
            {editing ? (
              <input
                id="display-name"
                type="text"
                value={editForm.display_name || ''}
                onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
              />
            ) : (
              <div className="text-neutral-900 dark:text-neutral-100">{player.display_name || 'Not set'}</div>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Email</label>
            {editing ? (
              <input
                id="email"
                type="email"
                value={editForm.primary_email || ''}
                onChange={(e) => setEditForm({ ...editForm, primary_email: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
              />
            ) : (
              <div className="text-neutral-900 dark:text-neutral-100">{player.primary_email}</div>
            )}
          </div>

          <div>
            <label htmlFor="game-access" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Game Access</label>
            {editing ? (
              <select
                id="game-access"
                value={editForm.game_access_granted ? 'true' : 'false'}
                onChange={(e) =>
                  setEditForm({ ...editForm, game_access_granted: e.target.value === 'true' })
                }
                className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
              >
                <option value="true">Granted</option>
                <option value="false">Not Granted</option>
              </select>
            ) : (
              <div>
                {player.game_access_granted ? (
                  <span className="px-3 py-1 text-sm font-semibold rounded-full bg-success-100 dark:bg-success-900/30 text-success-800 dark:text-success-400 border border-success-300 dark:border-success-700">
                    Granted
                  </span>
                ) : (
                  <span className="px-3 py-1 text-sm font-semibold rounded-full bg-error-100 dark:bg-error-900/30 text-error-800 dark:text-error-400 border border-error-300 dark:border-error-700">
                    Not Granted
                  </span>
                )}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="max-referrals" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Max Referrals</label>
            {editing ? (
              <input
                id="max-referrals"
                type="number"
                value={editForm.max_referrals || 0}
                onChange={(e) =>
                  setEditForm({ ...editForm, max_referrals: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
              />
            ) : (
              <div className="text-neutral-900 dark:text-neutral-100">{player.max_referrals}</div>
            )}
          </div>

          <div>
            <label htmlFor="player-id" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Player ID</label>
            <div id="player-id" className="text-neutral-900 dark:text-neutral-100 font-mono text-sm">{player.id}</div>
          </div>

          <div>
            <label htmlFor="joined-date" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Joined</label>
            <div id="joined-date" className="text-neutral-900 dark:text-neutral-100">{new Date(player.created_at).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Accounts Card */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">Linked Accounts</h2>
        <div className="space-y-3">
          {player.accounts.map((account, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 text-sm font-medium rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200">
                  {account.chain.toUpperCase()}
                </span>
                <span className="font-mono text-sm text-neutral-900 dark:text-neutral-100">{account.address}</span>
                {account.is_primary && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-400 border border-primary-300 dark:border-primary-700">
                    Primary
                  </span>
                )}
              </div>
            </div>
          ))}
          {player.accounts.length === 0 && (
            <div className="text-neutral-500 dark:text-neutral-400 text-center py-4">No linked accounts</div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Game Stats */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">Game Statistics</h3>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Total Spins</div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{player.game_stats.total_spins}</div>
            </div>
            <div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Total Bet</div>
              <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{formatNumberCompact(Number(player.game_stats.total_bet))}</div>
            </div>
            <div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Total Won</div>
              <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{formatNumberCompact(Number(player.game_stats.total_won))}</div>
            </div>
            <div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Net Result</div>
              <div className={`text-lg font-semibold ${parseFloat(player.game_stats.net_result) >= 0 ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'}`}>
                {formatNumberCompact(Number(player.game_stats.net_result))}
              </div>
            </div>
            <div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Win Rate</div>
              <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{player.game_stats.win_rate.toFixed(2)}%</div>
            </div>
          </div>
        </div>

        {/* Referral Stats */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">Referral Statistics</h3>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Total Referrals</div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{player.referrals_count}</div>
            </div>
            <div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Active Referrals</div>
              <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{player.active_referrals_count}</div>
            </div>
            <div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Credits Earned</div>
              <div className="text-lg font-semibold text-success-600 dark:text-success-400">{player.referral_credits_earned}</div>
            </div>
            <div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Max Referrals</div>
              <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{player.max_referrals}</div>
            </div>
          </div>
        </div>

        {/* Account Stats */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">Account Information</h3>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Total Plays</div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{player.total_plays || 0}</div>
            </div>
            <div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Total Wagered</div>
              <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{formatNumberCompact(Number(player.total_wagered))}</div>
            </div>
            <div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Last Play</div>
              <div className="text-sm text-neutral-900 dark:text-neutral-100">
                {player.last_play_at ? new Date(player.last_play_at).toLocaleString() : 'Never'}
              </div>
            </div>
            <div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Waitlist Position</div>
              <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {player.waitlist_position !== null ? `#${player.waitlist_position}` : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
