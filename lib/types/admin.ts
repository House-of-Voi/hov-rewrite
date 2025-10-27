/**
 * TypeScript types for admin functionality
 */

import type { AdminRole, Permission } from '@/lib/auth/admin';

export interface AdminRoleResponse {
  profile_id: string;
  role: AdminRole;
  permissions: Permission[];
  granted_by: string | null;
  granted_at: string;
}

// Player management types
export interface PlayerListItem {
  id: string;
  primary_email: string;
  display_name: string | null;
  avatar_url: string | null;
  game_access_granted: boolean;
  waitlist_position: number | null;
  waitlist_joined_at: string | null;
  created_at: string;
  total_plays?: number;
  total_wagered?: string;
  last_play_at?: string;
  accounts: Array<{
    chain: string;
    address: string;
    is_primary: boolean;
  }>;
}

export interface PlayerDetail extends PlayerListItem {
  max_referrals: number;
  updated_at: string;
  referrals_count: number;
  active_referrals_count: number;
  referral_credits_earned: string;
  game_stats: {
    total_spins: number;
    total_bet: string;
    total_won: string;
    net_result: string;
    win_rate: number;
    largest_win: string;
  };
}

export interface PlayerUpdateData {
  primary_email?: string;
  display_name?: string;
  avatar_url?: string;
  max_referrals?: number;
  game_access_granted?: boolean;
  waitlist_position?: number;
}

// Game management types
export interface GameListItem {
  id: string;
  game_type: 'slots' | 'keno' | 'roulette';
  name: string;
  description: string | null;
  house_edge: string;
  min_bet: string;
  max_bet: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  total_plays?: number;
  total_wagered?: string;
  total_payout?: string;
}

export interface GameDetail extends GameListItem {
  config: Record<string, unknown>;
  recent_plays: Array<{
    id: string;
    profile_id: string;
    player_address: string;
    bet_amount: string;
    payout_amount: string;
    profit_amount: string;
    created_at: string;
  }>;
}

export interface GameCreateData {
  game_type: 'slots' | 'keno' | 'roulette';
  name: string;
  description?: string;
  config: Record<string, unknown>;
  house_edge: number;
  min_bet: number;
  max_bet: number;
  active?: boolean;
}

export interface GameUpdateData {
  name?: string;
  description?: string;
  config?: Record<string, unknown>;
  house_edge?: number;
  min_bet?: number;
  max_bet?: number;
  active?: boolean;
}

// Treasury types
export interface TreasuryItem {
  contract_id: number;
  chain: 'base' | 'voi' | 'solana';
  game_type: 'slots' | 'keno' | 'roulette';
  game_name: string;
  balance: string;
  reserved: string;
  available: string;
  updated_at: string;
}

export interface ChainTotal {
  chain: 'base' | 'voi' | 'solana';
  total_balance: string;
  total_reserved: string;
  total_available: string;
  machine_count: number;
}

export interface GameTypeTotal {
  game_type: 'slots' | 'keno' | 'roulette';
  total_balance: string;
  total_reserved: string;
  total_available: string;
  machine_count: number;
}

export interface GrandTotal {
  total_balance: string;
  total_reserved: string;
  total_available: string;
  total_machines: number;
}

// Dashboard types
export interface DashboardStats {
  treasuries: TreasuryItem[];
  chain_totals: ChainTotal[];
  game_type_totals: GameTypeTotal[];
  grand_total: GrandTotal;
  today: {
    total_wagered: string;
    total_payout: string;
    house_profit: string;
    active_users: number;
    total_rounds: number;
  };
  weekly_summary: {
    total_wagered: string;
    total_payout: string;
    house_profit: string;
    avg_daily_users: number;
    total_rounds: number;
  };
  live_feed: Array<{
    id: string;
    player_address: string;
    game_name: string;
    game_type: string;
    chain: string;
    bet_amount: string;
    payout_amount: string;
    profit_amount: string;
    created_at: string;
  }>;
  mimir_stats: {
    total_spins: number;
    total_bet: string;
    total_won: string;
    net_result: string;
    rtp: number;
    win_rate: number;
    house_edge: number;
    unique_players: number;
    largest_win: string;
  } | null;
}

// Referral types
export interface ReferralCodeItem {
  id: string;
  code: string;
  referrer_profile_id: string;
  referrer_email: string;
  referrer_display_name: string | null;
  referred_profile_id: string | null;
  referred_email: string | null;
  referred_display_name: string | null;
  attributed_at: string | null;
  converted_at: string | null;
  deactivated_at: string | null;
  created_at: string;
  total_credits_earned?: string;
  referred_user_plays?: number;
}

export interface ReferralStats {
  total_codes: number;
  active_codes: number;
  converted_codes: number;
  pending_codes: number;
  deactivated_codes: number;
  conversion_rate: number;
  total_credits_distributed: string;
}

// Analytics types
export interface DailyStatsItem {
  date: string;
  chain: string | null;
  total_wagered: string;
  total_payout: string;
  house_profit: string;
  active_users: number;
  total_rounds: number;
}

export interface ChainBreakdown {
  chain: 'base' | 'voi' | 'solana';
  total_wagered: string;
  total_payout: string;
  house_profit: string;
  total_plays: number;
  unique_players: number;
  avg_bet_size: string;
  house_edge_actual: number;
}

export interface PlayerCohort {
  cohort_date: string;
  total_players: number;
  active_players: number;
  retention_rate: number;
  avg_wagered_per_player: string;
}

export interface AnalyticsDailyEntry {
  date: string;
  total_wagered: string;
  total_payout: string;
  house_profit: string;
  active_users: number;
  total_rounds: number;
}

export interface AnalyticsGameItem {
  game_id: string;
  game_name: string;
  game_type: 'slots' | 'keno' | 'roulette' | 'unknown';
  total_wagered: string;
  total_payout: string;
  house_profit: string;
  total_rounds: number;
  unique_players: number;
}

export interface AnalyticsPlayerItem {
  profile_id: string;
  display_name: string | null;
  primary_email: string | null;
  primary_address: string | null;
  total_wagered: string;
  total_payout: string;
  net_profit: string;
  wins: number;
  losses: number;
  last_play_at: string | null;
}

export interface AnalyticsChainDistributionItem {
  chain: 'base' | 'voi' | 'solana' | 'unknown';
  total_wagered: string;
  total_payout: string;
  house_profit: string;
  percentage_of_volume: number;
}

export interface AnalyticsSummary {
  total_volume: string;
  total_profit: string;
  avg_daily_users: number;
  total_rounds: number;
  house_edge: number;
}

export interface AnalyticsOverview {
  daily: AnalyticsDailyEntry[];
  top_games: AnalyticsGameItem[];
  top_players: AnalyticsPlayerItem[];
  chain_distribution: AnalyticsChainDistributionItem[];
  summary: AnalyticsSummary;
}

// Pagination and filtering
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PlayerFilters extends PaginationParams {
  search?: string;
  game_access?: boolean;
  on_waitlist?: boolean;
  chain?: 'base' | 'voi' | 'solana';
  created_after?: string;
  created_before?: string;
}

export interface GameFilters extends PaginationParams {
  game_type?: 'slots' | 'keno' | 'roulette';
  active?: boolean;
}

// Slot Machine Config types
export interface SlotMachineConfig {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  theme: string | null;
  contract_id: number;
  chain: 'base' | 'voi' | 'solana';
  treasury_address: string | null;
  rtp_target: string;
  house_edge: string;
  min_bet: number;
  max_bet: number;
  max_paylines: number;
  reel_config: Record<string, unknown>;
  is_active: boolean;
  launched_at: string;
  deprecated_at: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface SlotMachineConfigListItem extends SlotMachineConfig {
  total_spins?: number;
  total_wagered?: string;
  total_payout?: string;
  unique_players?: number;
}

export interface SlotMachineConfigFilters extends PaginationParams {
  chain?: 'base' | 'voi' | 'solana';
  is_active?: boolean;
  theme?: string;
}

export interface ReferralFilters extends PaginationParams {
  status?: 'active' | 'pending' | 'converted' | 'deactivated';
  referrer_id?: string;
  created_after?: string;
  created_before?: string;
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
