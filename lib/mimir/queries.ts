import type {
  MimirLeaderboardEntry,
  MimirPlatformStats,
  MimirPlayerStats,
  MimirSpinEvent,
  TournamentResponse,
  TournamentLeaderboardEntry,
} from '@/lib/types/database';
import { mimirRpc, MimirRpcError } from './client';

export async function getPlayerStats(
  address: string,
  contractId?: number
): Promise<MimirPlayerStats> {
  const params: Record<string, unknown> = {
    p_player_address: address,
  };

  // Always include p_app_id - use provided contractId or default
  params.p_app_id = contractId !== undefined ? contractId : DEFAULT_CONTRACT_ID;

  try {
    return await mimirRpc<MimirPlayerStats>('get_player_stats', params);
  } catch (error) {
    if (isFunctionMissing(error)) {
      return mimirRpc<MimirPlayerStats>('get_hov_player_stats', params);
    }

    throw error;
  }
}

export async function getPlatformStats(
  contractId?: number
): Promise<MimirPlatformStats[]> {
  // Build params object, always including p_app_id
  const params: Record<string, unknown> = {
    p_app_id: contractId !== undefined ? contractId : DEFAULT_CONTRACT_ID,
  };

  // Call get_hov_platform_stats which returns a TABLE
  // PostgREST returns this as an array of objects
  return await mimirRpc<MimirPlatformStats[]>('get_hov_platform_stats', params);
}

export async function getPlatformStatsByRounds(
  contractId: number,
  startRound?: number,
  endRound?: number
): Promise<MimirPlatformStats> {
  const params: Record<string, unknown> = {
    p_app_id: contractId,
  };

  if (startRound !== undefined) {
    params.p_start_round = startRound;
  }
  if (endRound !== undefined) {
    params.p_end_round = endRound;
  }

  // get_hov_platform_stats returns a TABLE, PostgREST returns it as an array
  const result = await mimirRpc<MimirPlatformStats[]>('get_hov_platform_stats', params);
  return result[0];
}

/**
 * Get platform stats for a specific date range
 * Note: This requires a helper function to convert dates to rounds via block_header table
 * The conversion is done in the API layer to avoid circular dependencies
 */
export async function getPlatformStatsByDate(
  contractId: number,
  startRound: number,
  endRound: number
): Promise<MimirPlatformStats> {
  return getPlatformStatsByRounds(contractId, startRound, endRound);
}

export type LeaderboardRankBy = 'won' | 'profit' | 'rtp' | 'volume';

// Default contract ID for Alpha Slots
const DEFAULT_CONTRACT_ID = 40879920;

export async function getLeaderboard(options: {
  contractId?: number;
  limit?: number;
  rankBy?: LeaderboardRankBy;
  byProfile?: boolean;
} = {}): Promise<MimirLeaderboardEntry[]> {
  const {
    contractId,
    limit = 100,
    rankBy = 'profit',
  } = options;

  // Map rankBy to p_metric values expected by the database
  const metricMap: Record<LeaderboardRankBy, string> = {
    won: 'total_won',
    profit: 'net_result',
    rtp: 'rtp',
    volume: 'total_bet',
  };

  const params: Record<string, unknown> = {
    p_metric: metricMap[rankBy] || 'net_result',
    p_limit: limit,
    p_offset: 0,
  };

  // Always include p_app_id - use provided contractId or default
  params.p_app_id = contractId !== undefined ? contractId : DEFAULT_CONTRACT_ID;

  // Call get_hov_leaderboard directly since get_leaderboard doesn't exist
  return await mimirRpc<MimirLeaderboardEntry[]>('get_hov_leaderboard', params);
}

export async function getPlayerSpins(
  address: string,
  contractId?: number,
  limit = 20,
  offset = 0
): Promise<MimirSpinEvent[]> {
  const params: Record<string, unknown> = {
    p_player_address: address,
    p_limit: limit,
    p_offset: offset,
  };

  // Always include p_app_id - use provided contractId or default
  params.p_app_id = contractId !== undefined ? contractId : DEFAULT_CONTRACT_ID;

  try {
    return await mimirRpc<MimirSpinEvent[]>('get_player_spins', params);
  } catch (error) {
    if (isFunctionMissing(error)) {
      return mimirRpc<MimirSpinEvent[]>('get_hov_player_spins', params);
    }

    throw error;
  }
}

export async function getPlayerStatsSafe(
  address: string,
  contractId?: number
): Promise<MimirPlayerStats | null> {
  try {
    return await getPlayerStats(address, contractId);
  } catch (error) {
    console.error(`Failed to fetch Mimir stats for ${address}:`, error);
    return null;
  }
}

export async function getTournamentLeaderboard(options: {
  contractId: number;
  startDate: Date;
  endDate: Date;
  limit?: number;
  rankBy?: LeaderboardRankBy;
  minSpins?: number;
  minVolumeMicro?: number;
}): Promise<MimirLeaderboardEntry[]> {
  const {
    contractId,
    startDate,
    endDate,
    limit = 100,
    rankBy = 'profit',
    minSpins = 0,
    minVolumeMicro = 0,
  } = options;

  const params = {
    p_app_id: contractId,
    p_start_ts: startDate.toISOString(),
    p_end_ts: endDate.toISOString(),
    p_limit: limit,
    p_min_spins: minSpins,
    p_min_volume_micro: minVolumeMicro,
  };

  const response = await mimirRpc<TournamentResponse>(
    'get_hov_tournament',
    params
  );

  // Map the tournament category to our standard leaderboard format
  const categoryMap: Record<LeaderboardRankBy, keyof TournamentResponse['categories']> = {
    won: 'total_won',
    profit: 'total_won', // Tournament doesn't have net_result, closest is total_won
    rtp: 'rtp',
    volume: 'volume',
  };

  const category = categoryMap[rankBy] || 'total_won';
  const entries: TournamentLeaderboardEntry[] = response.categories[category];

  // Convert tournament entries to standard MimirLeaderboardEntry format
  return entries.map((entry) => ({
    rank: entry.rank,
    identifier: entry.who,
    linked_addresses: [entry.who],
    total_spins: entry.total_spins || 0,
    total_bet: entry.total_volume || '0',
    total_won: entry.total_amount_won || '0',
    net_result: calculateNetResult(entry.total_amount_won, entry.total_volume),
    rtp: entry.rtp_percent || 0,
    win_rate: 0, // Not provided by tournament function
    largest_win: entry.largest_single_win || '0',
  }));
}

function calculateNetResult(won?: string, volume?: string): string {
  if (!won || !volume) return '0';
  const wonBigInt = BigInt(won);
  const volumeBigInt = BigInt(volume);
  return (wonBigInt - volumeBigInt).toString();
}

function isFunctionMissing(error: unknown): boolean {
  return error instanceof MimirRpcError && error.code === 'PGRST202';
}
