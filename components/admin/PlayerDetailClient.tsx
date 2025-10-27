'use client';

import { useState, useEffect } from 'react';
import type { PlayerDetail } from '@/lib/types/admin';

interface PlayerDetailClientProps {
  playerId: string;
}

export default function PlayerDetailClient({ playerId }: PlayerDetailClientProps) {
  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<PlayerDetail>>({});

  useEffect(() => {
    fetchPlayer();
  }, [playerId]);

  const fetchPlayer = async () => {
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
  };

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
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="text-gray-500">Loading player details...</div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        {error || 'Player not found'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
          {editing ? (
            <div className="space-x-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setEditForm(player);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
            {editing ? (
              <input
                type="text"
                value={editForm.display_name || ''}
                onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            ) : (
              <div className="text-gray-900">{player.display_name || 'Not set'}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            {editing ? (
              <input
                type="email"
                value={editForm.primary_email || ''}
                onChange={(e) => setEditForm({ ...editForm, primary_email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            ) : (
              <div className="text-gray-900">{player.primary_email}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Game Access</label>
            {editing ? (
              <select
                value={editForm.game_access_granted ? 'true' : 'false'}
                onChange={(e) =>
                  setEditForm({ ...editForm, game_access_granted: e.target.value === 'true' })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="true">Granted</option>
                <option value="false">Not Granted</option>
              </select>
            ) : (
              <div>
                {player.game_access_granted ? (
                  <span className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                    Granted
                  </span>
                ) : (
                  <span className="px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">
                    Not Granted
                  </span>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Referrals</label>
            {editing ? (
              <input
                type="number"
                value={editForm.max_referrals || 5}
                onChange={(e) =>
                  setEditForm({ ...editForm, max_referrals: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            ) : (
              <div className="text-gray-900">{player.max_referrals}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Player ID</label>
            <div className="text-gray-900 font-mono text-sm">{player.id}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Joined</label>
            <div className="text-gray-900">{new Date(player.created_at).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Accounts Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Linked Accounts</h2>
        <div className="space-y-3">
          {player.accounts.map((account, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 text-sm font-medium rounded bg-gray-200 text-gray-800">
                  {account.chain.toUpperCase()}
                </span>
                <span className="font-mono text-sm text-gray-900">{account.address}</span>
                {account.is_primary && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                    Primary
                  </span>
                )}
              </div>
            </div>
          ))}
          {player.accounts.length === 0 && (
            <div className="text-gray-500 text-center py-4">No linked accounts</div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Game Stats */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Game Statistics</h3>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600">Total Spins</div>
              <div className="text-2xl font-bold text-gray-900">{player.game_stats.total_spins}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Bet</div>
              <div className="text-lg font-semibold text-gray-900">{player.game_stats.total_bet}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Won</div>
              <div className="text-lg font-semibold text-gray-900">{player.game_stats.total_won}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Net Result</div>
              <div className={`text-lg font-semibold ${parseFloat(player.game_stats.net_result) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {player.game_stats.net_result}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Win Rate</div>
              <div className="text-lg font-semibold text-gray-900">{player.game_stats.win_rate.toFixed(2)}%</div>
            </div>
          </div>
        </div>

        {/* Referral Stats */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Referral Statistics</h3>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600">Total Referrals</div>
              <div className="text-2xl font-bold text-gray-900">{player.referrals_count}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Active Referrals</div>
              <div className="text-lg font-semibold text-gray-900">{player.active_referrals_count}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Credits Earned</div>
              <div className="text-lg font-semibold text-green-600">{player.referral_credits_earned}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Max Referrals</div>
              <div className="text-lg font-semibold text-gray-900">{player.max_referrals}</div>
            </div>
          </div>
        </div>

        {/* Account Stats */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Account Information</h3>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600">Total Plays</div>
              <div className="text-2xl font-bold text-gray-900">{player.total_plays || 0}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Wagered</div>
              <div className="text-lg font-semibold text-gray-900">{player.total_wagered}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Last Play</div>
              <div className="text-sm text-gray-900">
                {player.last_play_at ? new Date(player.last_play_at).toLocaleString() : 'Never'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Waitlist Position</div>
              <div className="text-lg font-semibold text-gray-900">
                {player.waitlist_position !== null ? `#${player.waitlist_position}` : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
