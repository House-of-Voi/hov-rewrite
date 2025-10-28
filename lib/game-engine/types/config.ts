/**
 * Game Engine Configuration Types
 *
 * These types define the configuration structure for the slot machine game engine.
 */

/**
 * Engine initialization configuration
 */
export interface EngineConfig {
  /** Whether to run in sandbox mode (using mock adapter) */
  sandbox?: boolean;
  /** Optional wallet address to use */
  walletAddress?: string;
}

/**
 * Chain types supported by the platform
 */
export type ChainType = 'base' | 'voi' | 'solana';

/**
 * Symbol identifiers used in the slot machine
 * Based on the 5reel contract: A, B, C, D, and _ (blank)
 */
export type SymbolId = 'A' | 'B' | 'C' | 'D' | '_';

/**
 * Payline pattern - defines y-coordinates for each of the 5 reels
 * Example: [1, 1, 1, 1, 1] = middle line
 *          [0, 0, 0, 0, 0] = top line
 *          [0, 1, 2, 1, 0] = V-shape
 */
export type PaylinePattern = [number, number, number, number, number];

/**
 * Payout multiplier configuration for a symbol
 */
export interface SymbolPayouts {
  /** Symbol identifier */
  symbol: SymbolId;
  /** Display name for UI */
  displayName: string;
  /** Multiplier for 3 consecutive matches */
  match3: number;
  /** Multiplier for 4 consecutive matches */
  match4: number;
  /** Multiplier for 5 consecutive matches */
  match5: number;
}

/**
 * Complete paytable configuration
 */
export interface PaytableConfig {
  /** Payout configurations for each symbol */
  symbols: SymbolPayouts[];
  /** Maximum payout multiplier (contract enforces this) */
  maxPayoutMultiplier: number;
}

/**
 * Reel configuration
 */
export interface ReelConfig {
  /** Number of reels (always 5 for this game) */
  reelCount: 5;
  /** Length of each reel (always 100 for this contract) */
  reelLength: 100;
  /** Visible window size (always 3 for this game) */
  windowLength: 3;
  /** Symbol distribution for each reel */
  reels: SymbolId[][];
}

/**
 * Main slot machine configuration
 */
export interface SlotMachineConfig {
  /** Unique identifier for this config */
  id: string;
  /** Human-readable name */
  name: string;
  /** Display name for UI */
  displayName: string;
  /** Contract application ID on the blockchain */
  contractId: bigint;
  /** Blockchain network */
  chain: ChainType;
  /** Target RTP percentage (e.g., 96.50 for 96.50%) */
  rtpTarget: number;
  /** House edge percentage (e.g., 3.50 for 3.5%) */
  houseEdge: number;
  /** Minimum bet per line in microVOI (e.g., 1000000 = 1 VOI) */
  minBet: number;
  /** Maximum bet per line in microVOI */
  maxBet: number;
  /** Maximum number of paylines that can be selected */
  maxPaylines: number;
  /** Reel configuration */
  reelConfig: ReelConfig;
  /** All payline patterns (20 for this game) */
  paylinePatterns: PaylinePattern[];
  /** Paytable configuration */
  paytable: PaytableConfig;
  /** Whether this machine is currently active */
  isActive: boolean;
  /** When this machine was launched */
  launchedAt?: Date;
}

/**
 * Contract state from the blockchain
 */
export interface ContractState {
  /** Contract's available balance */
  balanceAvailable: bigint;
  /** Contract's total balance */
  balanceTotal: bigint;
  /** Contract's locked balance */
  balanceLocked: bigint;
  /** Current block number */
  currentBlock: number;
}

/**
 * Transaction fees configuration
 */
export interface TransactionFees {
  /** Base spin transaction cost in microAlgos */
  spinCost: number;
  /** Cost for bet record box in microAlgos */
  boxCost: number;
  /** Network transaction fee in microAlgos */
  networkFee: number;
  /** Buffer for additional costs */
  buffer: number;
}

/**
 * Default transaction fees based on contract
 */
export const DEFAULT_TRANSACTION_FEES: TransactionFees = {
  spinCost: 50_500, // From contract
  boxCost: 28_500, // Bet record box
  networkFee: 15_000, // Standard network fee
  buffer: 10_000, // Safety buffer
};

/**
 * Betting limits and constraints
 */
export interface BettingLimits {
  /** Minimum bet per line */
  minBetPerLine: number;
  /** Maximum bet per line */
  maxBetPerLine: number;
  /** Minimum number of paylines */
  minPaylines: number;
  /** Maximum number of paylines */
  maxPaylines: number;
  /** Maximum total bet across all paylines */
  maxTotalBet: number;
}
