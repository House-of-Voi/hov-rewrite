export interface SlotMachineConfig {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  theme?: string;
  contract_id: number;
  chain: 'voi' | 'base' | 'solana';
  treasury_address?: string;
  rtp_target: number;
  house_edge: number;
  min_bet: number;
  max_bet: number;
  max_paylines: number;
  reel_config: {
    reelCount: number;
    reelLength: number;
    windowLength: number;
    reels: number[][];
    paylines: number[][];
    payouts: Record<string, Record<string, number>>;
    symbolNames: string[];
  };
  is_active: boolean;
  launched_at: string;
  deprecated_at?: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface StatsSnapshotDaily {
  id: string;
  date: string;
  snapshot_type: 'platform' | 'machine' | 'leaderboard';
  slot_machine_config_id?: string;
  stats_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface StatsSnapshotHourly {
  id: string;
  hour: string;
  snapshot_type: 'leaderboard_address' | 'leaderboard_profile' | 'trending';
  slot_machine_config_id?: string;
  stats_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MimirPlayerStats {
  player_address: string;
  total_spins: number;
  winning_spins: number;
  losing_spins: number;
  total_bet: string;
  total_won: string;
  net_result: string;
  rtp: number;
  win_rate: number;
  largest_win: string;
  largest_bet: string;
  avg_bet: string;
  avg_payout: string;
  first_spin: string;
  last_spin: string;
}

export interface MimirPlatformStats {
  total_bets: number;
  total_amount_bet: number;
  total_amount_paid: number;
  total_winning_spins: number;
  average_bet_size: number;
  average_payout: number;
  win_percentage: number;
  house_edge: number;
  rtp: number;
  net_platform_result: number;
  unique_players: number;
  largest_single_win: number;
  largest_single_bet: number;
}

export interface MimirLeaderboardEntry {
  rank: number;
  identifier: string;
  linked_addresses: string[];
  total_spins: number;
  total_bet: string;
  total_won: string;
  net_result: string;
  rtp: number;
  win_rate: number;
  largest_win: string;
  largest_bet?: string;
}

export interface MimirSpinEvent {
  id: string;
  chain: 'voi' | 'base' | 'solana';
  txid: string;
  block: number;
  round: number;
  timestamp: string;
  contract_id: number;
  player_address: string;
  amount: string;
  payout: string;
  net_result: string;
  result_data?: {
    reelStops: number[];
    wins: unknown[];
    seed: string;
  };
}

export interface TournamentLeaderboardEntry {
  rank: number;
  who: string;
  total_volume?: string;
  total_amount_won?: string;
  largest_single_win?: string;
  total_spins?: number;
  rtp_percent?: number;
  longest_win_streak?: number;
  longest_losing_streak?: number;
  volume_rank?: number;
  rtp_rank?: number;
  streak_rank?: number;
  combined_rank?: number;
}

export interface TournamentResponse {
  params: {
    app_id: number;
    start_ts: string;
    end_ts: string;
    limit: number;
    min_spins: number;
    min_volume_micro: number;
  };
  categories: {
    volume: TournamentLeaderboardEntry[];
    total_won: TournamentLeaderboardEntry[];
    biggest_win: TournamentLeaderboardEntry[];
    rtp: TournamentLeaderboardEntry[];
    win_streak: TournamentLeaderboardEntry[];
    losing_streak: TournamentLeaderboardEntry[];
    overall: TournamentLeaderboardEntry[];
  };
}
