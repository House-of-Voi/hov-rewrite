'use client';

import { useEffect, useMemo, useState } from 'react';
import Card, { CardContent, CardHeader } from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { SlotMachineIcon } from '@/components/icons';
import type { SlotMachineConfigListItem, PaginatedResponse } from '@/lib/types/admin';
import { formatNumberCompact } from '@/lib/utils/format';

type SlotConfigsResponse = PaginatedResponse<SlotMachineConfigListItem>;

interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

const PAGE_SIZE = 20;

const toPercent = (value: string | number) => {
  const numeric = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(numeric)) return '0.00';
  return numeric.toFixed(2);
};

const formatCurrency = (value: string | number) => {
  const numeric = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(numeric)) return '0.00';
  return numeric.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatMicroVoi = (microVoi: number) => {
  return (microVoi / 1000000).toFixed(6);
};

export default function GamesClient() {
  const [games, setGames] = useState<SlotMachineConfigListItem[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    total_pages: 0,
  });
  const [chainFilter, setChainFilter] = useState<'all' | 'base' | 'voi' | 'solana'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingGame, setEditingGame] = useState<SlotMachineConfigListItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    house_edge: '',
    min_bet: '',
    max_bet: '',
    description: '',
  });

  useEffect(() => {
    fetchGames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, chainFilter, statusFilter]);

  const fetchGames = async (background = false) => {
    try {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
        setError(null);
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: PAGE_SIZE.toString(),
      });

      if (chainFilter !== 'all') params.set('chain', chainFilter);
      if (statusFilter !== 'all') params.set('is_active', statusFilter === 'active' ? 'true' : 'false');

      const response = await fetch(`/api/admin/slot-configs?${params.toString()}`, {
        cache: 'no-store',
      });
      const body: ApiResult<SlotConfigsResponse> = await response.json();

      if (body.success && body.data) {
        setGames(body.data.data);
        setPagination(body.data.pagination);
      } else {
        setError(body.error || 'Failed to fetch slot machine configurations');
      }
    } catch (err) {
      console.error('Error fetching slot configs:', err);
      setError('Failed to load slot machine data');
    } finally {
      if (background) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleToggleGameStatus = async (game: SlotMachineConfigListItem) => {
    alert('Status toggling for slot machine configs will be implemented in the next phase');
    // TODO: Implement API endpoint for updating slot machine config status
  };

  const openEditModal = (game: SlotMachineConfigListItem) => {
    setEditingGame(game);
    setEditForm({
      house_edge: toPercent(game.house_edge),
      min_bet: formatMicroVoi(game.min_bet),
      max_bet: formatMicroVoi(game.max_bet),
      description: game.description || '',
    });
  };

  const handleEditChange = (field: keyof typeof editForm, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveGameChanges = async () => {
    if (!editingGame) return;
    alert('Editing slot machine configs will be implemented in the next phase');
    // TODO: Implement API endpoint for updating slot machine configs
    setEditingGame(null);
  };

  const paginatedLabel = useMemo(() => {
    if (pagination.total === 0) return 'No games';
    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(pagination.page * pagination.limit, pagination.total);
    return `Showing ${start}-${end} of ${pagination.total}`;
  }, [pagination]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold text-neutral-950 dark:text-white uppercase">Slot Machine Configurations</h1>
          <p className="text-neutral-700 dark:text-neutral-300 mt-2">
            Monitor and configure all slot machine games from the database
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchGames(true)}
            disabled={refreshing}
            className={`px-4 py-2 text-sm border-2 rounded-lg font-medium transition-colors ${
              refreshing
                ? 'border-neutral-700 text-neutral-500 cursor-not-allowed'
                : 'border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950'
            }`}
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <a href="/admin">
            <Button variant="ghost" size="sm">
              ← Back to Dashboard
            </Button>
          </a>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <select
              value={chainFilter}
              onChange={(event) => {
                setPage(1);
                setChainFilter(event.target.value as typeof chainFilter);
              }}
              className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
            >
              <option value="all">All Chains</option>
              <option value="voi">VOI</option>
              <option value="base">Base</option>
              <option value="solana">Solana</option>
            </select>
            <select
              value={statusFilter}
              onChange={(event) => {
                setPage(1);
                setStatusFilter(event.target.value as typeof statusFilter);
              }}
              className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <div className="md:col-span-2 flex items-center justify-end text-xs text-neutral-600 dark:text-neutral-400">
              {paginatedLabel}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {error && (
        <Card>
          <CardContent>
            <div className="p-4 text-ruby-400">{error}</div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent>
            <div className="p-8 text-center text-neutral-500">Loading games…</div>
          </CardContent>
        </Card>
      ) : games.length === 0 ? (
        <Card>
          <CardContent>
            <div className="p-8 text-center text-neutral-500">No games match your filters.</div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {games.map((game) => {
            const totalWagered = parseFloat(game.total_wagered || '0');
            const totalPayout = parseFloat(game.total_payout || '0');
            const profit = totalWagered - totalPayout;
            const actualEdge = totalWagered > 0 ? ((profit / totalWagered) * 100).toFixed(2) : '0.00';

            return (
              <Card key={game.id} glow={game.is_active}>
                <CardContent className="p-8">
                  <div className="grid lg:grid-cols-12 gap-6">
                    {/* Game Info */}
                    <div className="lg:col-span-4 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="text-primary-600 dark:text-primary-400">
                          <SlotMachineIcon size={48} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 uppercase">
                              {game.display_name}
                            </h3>
                            {game.is_active ? (
                              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30 font-bold uppercase">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-neutral-700 text-neutral-400 text-xs rounded-full border border-neutral-600 font-bold uppercase">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-neutral-400 text-sm mt-1">
                            {game.description || 'No description provided.'}
                          </p>
                          <p className="text-neutral-500 text-xs mt-1">
                            Contract ID: {game.contract_id} • Chain: {game.chain.toUpperCase()}
                          </p>
                        </div>
                      </div>

                      {/* Configuration */}
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
                          <span className="text-neutral-500">House Edge:</span>
                          <span className="text-neutral-300 font-semibold">
                            {toPercent(game.house_edge)}%
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
                          <span className="text-neutral-500">RTP Target:</span>
                          <span className="text-neutral-300 font-semibold">
                            {toPercent(game.rtp_target)}%
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
                          <span className="text-neutral-500">Min/Max Bet:</span>
                          <span className="text-neutral-300 font-semibold">
                            {formatMicroVoi(game.min_bet)} - {formatMicroVoi(game.max_bet)} VOI
                          </span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-neutral-500">Total Spins:</span>
                          <span className="text-neutral-300 font-semibold">
                            {(game.total_spins || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
                        <div className="text-xs text-neutral-500 uppercase tracking-wider font-bold mb-2">
                          Total Wagered
                        </div>
                        <div className="text-2xl font-black text-primary-600 dark:text-primary-400">
                          {formatNumberCompact(totalWagered)} VOI
                        </div>
                      </div>
                      <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
                        <div className="text-xs text-neutral-500 uppercase tracking-wider font-bold mb-2">
                          Total Payout
                        </div>
                        <div className="text-2xl font-black text-primary-600 dark:text-primary-400">
                          {formatNumberCompact(totalPayout)} VOI
                        </div>
                      </div>
                      <div className="p-4 rounded-lg border border-green-900/20 bg-green-500/5">
                        <div className="text-xs text-neutral-500 uppercase tracking-wider font-bold mb-2">
                          House Profit
                        </div>
                        <div className={`text-2xl font-black ${profit >= 0 ? 'text-green-400' : 'text-ruby-400'}`}>
                          {formatNumberCompact(profit)} VOI
                        </div>
                      </div>
                      <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
                        <div className="text-xs text-neutral-500 uppercase tracking-wider font-bold mb-2">
                          Actual Edge
                        </div>
                        <div className="text-2xl font-black text-primary-600 dark:text-primary-400">
                          {actualEdge}%
                        </div>
                        <div className="text-xs text-neutral-500 mt-1">
                          Target: {toPercent(game.house_edge)}%
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="lg:col-span-3 flex flex-col gap-3">
                      <Button
                        variant={game.is_active ? 'outline' : 'primary'}
                        size="md"
                        onClick={() => handleToggleGameStatus(game)}
                        className="w-full"
                      >
                        {game.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="md"
                        onClick={() => openEditModal(game)}
                        className="w-full"
                      >
                        View Configuration
                      </Button>
                      {game.theme && (
                        <div className="px-3 py-2 bg-neutral-800/50 rounded-lg text-center">
                          <span className="text-xs text-neutral-400">Theme:</span>
                          <span className="text-sm text-primary-600 dark:text-primary-400 font-semibold ml-2 capitalize">{game.theme}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination controls */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-500">{paginatedLabel}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className={`px-3 py-2 text-sm rounded-lg border ${
                page === 1
                  ? 'border-neutral-700 text-neutral-500 cursor-not-allowed'
                  : 'border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, pagination.total_pages))}
              disabled={page >= pagination.total_pages}
              className={`px-3 py-2 text-sm rounded-lg border ${
                page >= pagination.total_pages
                  ? 'border-neutral-700 text-neutral-500 cursor-not-allowed'
                  : 'border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* View Game Configuration Modal */}
      {editingGame && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 uppercase">
                  {editingGame.display_name} Configuration
                </h2>
                <button
                  onClick={() => setEditingGame(null)}
                  className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-2xl"
                >
                  ×
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-neutral-800/50 rounded-lg">
                  <div className="text-xs text-neutral-500 uppercase mb-1">Internal Name</div>
                  <div className="text-neutral-300 font-semibold">{editingGame.name}</div>
                </div>
                <div className="p-4 bg-neutral-800/50 rounded-lg">
                  <div className="text-xs text-neutral-500 uppercase mb-1">Contract ID</div>
                  <div className="text-neutral-300 font-semibold">{editingGame.contract_id}</div>
                </div>
                <div className="p-4 bg-neutral-800/50 rounded-lg">
                  <div className="text-xs text-neutral-500 uppercase mb-1">Chain</div>
                  <div className="text-neutral-300 font-semibold uppercase">{editingGame.chain}</div>
                </div>
                <div className="p-4 bg-neutral-800/50 rounded-lg">
                  <div className="text-xs text-neutral-500 uppercase mb-1">Theme</div>
                  <div className="text-neutral-300 font-semibold capitalize">{editingGame.theme || 'None'}</div>
                </div>
                <div className="p-4 bg-neutral-800/50 rounded-lg">
                  <div className="text-xs text-neutral-500 uppercase mb-1">House Edge</div>
                  <div className="text-neutral-300 font-semibold">{toPercent(editingGame.house_edge)}%</div>
                </div>
                <div className="p-4 bg-neutral-800/50 rounded-lg">
                  <div className="text-xs text-neutral-500 uppercase mb-1">RTP Target</div>
                  <div className="text-neutral-300 font-semibold">{toPercent(editingGame.rtp_target)}%</div>
                </div>
                <div className="p-4 bg-neutral-800/50 rounded-lg">
                  <div className="text-xs text-neutral-500 uppercase mb-1">Min Bet</div>
                  <div className="text-neutral-300 font-semibold">{formatMicroVoi(editingGame.min_bet)} VOI</div>
                </div>
                <div className="p-4 bg-neutral-800/50 rounded-lg">
                  <div className="text-xs text-neutral-500 uppercase mb-1">Max Bet</div>
                  <div className="text-neutral-300 font-semibold">{formatMicroVoi(editingGame.max_bet)} VOI</div>
                </div>
                <div className="p-4 bg-neutral-800/50 rounded-lg">
                  <div className="text-xs text-neutral-500 uppercase mb-1">Max Paylines</div>
                  <div className="text-neutral-300 font-semibold">{editingGame.max_paylines}</div>
                </div>
                <div className="p-4 bg-neutral-800/50 rounded-lg">
                  <div className="text-xs text-neutral-500 uppercase mb-1">Version</div>
                  <div className="text-neutral-300 font-semibold">v{editingGame.version}</div>
                </div>
              </div>

              {editingGame.description && (
                <div className="p-4 bg-neutral-800/50 rounded-lg">
                  <div className="text-xs text-neutral-500 uppercase mb-2">Description</div>
                  <div className="text-neutral-300">{editingGame.description}</div>
                </div>
              )}

              <div className="p-4 bg-neutral-800/50 rounded-lg">
                <div className="text-xs text-neutral-500 uppercase mb-2">Reel Configuration</div>
                <pre className="text-xs text-neutral-400 overflow-x-auto max-h-48 overflow-y-auto">
                  {JSON.stringify(editingGame.reel_config, null, 2)}
                </pre>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setEditingGame(null)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
