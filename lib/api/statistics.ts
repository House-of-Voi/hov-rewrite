import type {
  MimirPlayerStats,
  MimirPlatformStats,
  MimirLeaderboardEntry,
  MimirSpinEvent,
} from '@/lib/types/database';
import { AggregatedProfileStatsPayload } from '@/lib/mimir/aggregation';

/**
 * Fetch platform statistics for a slot machine
 */
export async function fetchPlatformStats(options: {
  contractId: number;
  timeframe?: 'daily' | 'all-time';
  date?: Date | string;
}) {
  const params = new URLSearchParams();
  params.append('contractId', String(options.contractId));

  if (options.timeframe !== undefined) {
    params.append('timeframe', options.timeframe);
  }
  if (options.date !== undefined) {
    const dateStr = options.date instanceof Date
      ? options.date.toISOString().split('T')[0]
      : options.date;
    params.append('date', dateStr);
  }

  const response = await fetch(
    `/api/statistics/platform?${params.toString()}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch platform statistics');
  }

  const data = await response.json();
  return data.data as (MimirPlatformStats & {
    machine_name: string | null;
    slot_machine_config_id: string | null;
    chain: 'base' | 'voi' | 'solana' | null;
  })[];
}

/**
 * Fetch statistics for a specific player address
 */
export async function fetchPlayerStats(
  address: string,
  contractId?: number
) {
  const params = new URLSearchParams();
  if (contractId !== undefined) {
    params.append('contractId', String(contractId));
  }

  const response = await fetch(
    `/api/statistics/player/${encodeURIComponent(address)}${params.toString() ? '?' + params : ''}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch player statistics for ${address}`);
  }

  const data = await response.json();
  return data.data as MimirPlayerStats;
}

/**
 * Fetch spin history for a specific player address
 */
export async function fetchPlayerSpins(
  address: string,
  options: {
    contractId?: number;
    limit?: number;
    offset?: number;
    order?: 'asc' | 'desc';
  } = {}
) {
  const params = new URLSearchParams();
  if (options.contractId !== undefined) {
    params.append('contractId', String(options.contractId));
  }
  if (options.limit !== undefined) {
    params.append('limit', String(options.limit));
  }
  if (options.offset !== undefined) {
    params.append('offset', String(options.offset));
  }
  if (options.order !== undefined) {
    params.append('order', options.order);
  }

  const response = await fetch(
    `/api/statistics/player/${encodeURIComponent(address)}/spins${params.toString() ? '?' + params : ''}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch spins for ${address}`);
  }

  const data = await response.json();
  return data.data as {
    spins: MimirSpinEvent[];
    limit: number;
    offset: number;
    total: number;
  };
}

/**
 * Fetch aggregated statistics for the current authenticated user
 */
export async function fetchMyProfileStats(contractId?: number) {
  const params = new URLSearchParams();
  if (contractId !== undefined) {
    params.append('contractId', String(contractId));
  }

  const response = await fetch(
    `/api/statistics/profile/me${params.toString() ? '?' + params : ''}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Not authenticated');
    }
    throw new Error('Failed to fetch profile statistics');
  }

  const data = await response.json();
  return data.data as AggregatedProfileStatsPayload;
}

/**
 * Fetch per-address breakdown for the current authenticated user
 */
export async function fetchMyProfileBreakdown(contractId?: number) {
  const params = new URLSearchParams();
  if (contractId !== undefined) {
    params.append('contractId', String(contractId));
  }

  const response = await fetch(
    `/api/statistics/profile/me/breakdown${params.toString() ? '?' + params : ''}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Not authenticated');
    }
    throw new Error('Failed to fetch profile breakdown');
  }

  const data = await response.json();
  return data.data as Array<{
    address: string;
    chain: 'base' | 'voi' | 'solana';
    stats: MimirPlayerStats | null;
  }>;
}

/**
 * Fetch leaderboard with flexible ranking options
 */
export async function fetchLeaderboard(options: {
  contractId?: number;
  rankBy?: 'won' | 'profit' | 'rtp' | 'volume';
  limit?: number;
  machineId?: string;
  timeframe?: 'daily' | 'all-time';
  date?: Date | string;
} = {}) {
  const params = new URLSearchParams();
  if (options.contractId !== undefined) {
    params.append('contractId', String(options.contractId));
  }
  if (options.rankBy !== undefined) {
    params.append('rankBy', options.rankBy);
  }
  if (options.limit !== undefined) {
    params.append('limit', String(options.limit));
  }
  if (options.machineId !== undefined) {
    params.append('machineId', options.machineId);
  }
  if (options.timeframe !== undefined) {
    params.append('timeframe', options.timeframe);
  }
  if (options.date !== undefined) {
    const dateStr = options.date instanceof Date
      ? options.date.toISOString().split('T')[0]
      : options.date;
    params.append('date', dateStr);
  }

  const response = await fetch(
    `/api/statistics/leaderboard${params.toString() ? '?' + params : ''}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch leaderboard');
  }

  const data = await response.json();
  return data.data as (MimirLeaderboardEntry & {
    display_name: string | null;
    profile_id: string | null;
  })[];
}
