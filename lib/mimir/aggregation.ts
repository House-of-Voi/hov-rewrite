import type { MimirPlayerStats } from '@/lib/types/database';
import { getPlayerStats, getPlayerStatsSafe } from './queries';

export interface AggregatedProfileStats {
  addresses: string[];
  total_spins: number;
  winning_spins: number;
  losing_spins: number;
  total_bet: bigint;
  total_won: bigint;
  net_result: bigint;
  rtp: number;
  win_rate: number;
  largest_win: bigint;
}

export interface AggregatedProfileStatsPayload {
  addresses: string[];
  total_spins: number;
  winning_spins: number;
  losing_spins: number;
  total_bet: string;
  total_won: string;
  net_result: string;
  rtp: number;
  win_rate: number;
  largest_win: string;
}

export async function getAggregatedProfileStats(
  addresses: string[],
  contractId?: number
): Promise<AggregatedProfileStats> {
  if (addresses.length === 0) {
    throw new Error('At least one address is required to aggregate statistics.');
  }

  const stats = await Promise.all(
    addresses.map((address) => getPlayerStats(address, contractId))
  );

  return aggregatePlayerStats(addresses, stats);
}

export async function getAggregatedProfileStatsSafe(
  addresses: string[],
  contractId?: number
): Promise<AggregatedProfileStats | null> {
  if (addresses.length === 0) {
    return null;
  }

  const results = await Promise.all(
    addresses.map((address) => getPlayerStatsSafe(address, contractId))
  );

  const validStats = results.filter((stat): stat is MimirPlayerStats => stat !== null);

  if (validStats.length === 0) {
    return null;
  }

  const validAddresses = addresses.filter((_, index) => results[index] !== null);

  return aggregatePlayerStats(validAddresses, validStats);
}

function aggregatePlayerStats(
  addresses: string[],
  stats: MimirPlayerStats[]
): AggregatedProfileStats {
  let totalSpins = 0;
  let winningSpins = 0;
  let losingSpins = 0;
  let totalBet = BigInt(0);
  let totalWon = BigInt(0);
  let largestWin = BigInt(0);

  for (const entry of stats) {
    totalSpins += entry.total_spins;
    winningSpins += entry.winning_spins;
    losingSpins += entry.losing_spins;
    totalBet += BigInt(entry.total_bet);
    totalWon += BigInt(entry.total_won);

    const entryLargestWin = BigInt(entry.largest_win);
    if (entryLargestWin > largestWin) {
      largestWin = entryLargestWin;
    }
  }

  const netResult = totalWon - totalBet;
  const rtp = totalBet > 0n ? (Number(totalWon) / Number(totalBet)) * 100 : 0;
  const winRate = totalSpins > 0 ? (winningSpins / totalSpins) * 100 : 0;

  return {
    addresses,
    total_spins: totalSpins,
    winning_spins: winningSpins,
    losing_spins: losingSpins,
    total_bet: totalBet,
    total_won: totalWon,
    net_result: netResult,
    rtp,
    win_rate: winRate,
    largest_win: largestWin,
  };
}

export function serializeAggregatedProfileStats(
  stats: AggregatedProfileStats
): AggregatedProfileStatsPayload {
  return {
    addresses: stats.addresses,
    total_spins: stats.total_spins,
    winning_spins: stats.winning_spins,
    losing_spins: stats.losing_spins,
    total_bet: stats.total_bet.toString(),
    total_won: stats.total_won.toString(),
    net_result: stats.net_result.toString(),
    rtp: stats.rtp,
    win_rate: stats.win_rate,
    largest_win: stats.largest_win.toString(),
  };
}
