/**
 * Game State Management Types
 *
 * These types define the runtime state of the slot machine game.
 */

import type { SymbolId, PaylinePattern } from './config';
import type { SpinOutcome } from './results';

/**
 * Status of a queued spin through its lifecycle
 */
export enum SpinStatus {
  /** Spin created but not yet submitted to blockchain */
  PENDING = 'PENDING',
  /** Transaction is being submitted */
  SUBMITTING = 'SUBMITTING',
  /** Transaction submitted, waiting for next block to claim */
  WAITING = 'WAITING',
  /** Processing outcome */
  PROCESSING = 'PROCESSING',
  /** Ready to claim winnings */
  READY_TO_CLAIM = 'READY_TO_CLAIM',
  /** Claiming transaction in progress */
  CLAIMING = 'CLAIMING',
  /** Spin completed successfully */
  COMPLETED = 'COMPLETED',
  /** Spin failed (transaction error, timeout, etc.) */
  FAILED = 'FAILED',
  /** Spin expired (claim window passed) */
  EXPIRED = 'EXPIRED',
}

/**
 * A spin that has been queued for processing
 */
export interface QueuedSpin {
  /** Unique identifier for this spin */
  id: string;
  /** Current status */
  status: SpinStatus;
  /** Bet amount per line in microVOI */
  betPerLine: number;
  /** Number of paylines selected */
  paylines: number;
  /** Total bet amount (betPerLine * paylines) */
  totalBet: number;
  /** Timestamp when spin was created */
  timestamp: number;
  /** Bet key from contract (after submission) */
  betKey?: string;
  /** Transaction ID for spin transaction */
  spinTxId?: string;
  /** Block number when spin was submitted */
  submitBlock?: number;
  /** Block number when outcome can be claimed */
  claimBlock?: number;
  /** Transaction ID for claim transaction */
  claimTxId?: string;
  /** Outcome after claiming */
  outcome?: SpinOutcome;
  /** Winnings in microVOI */
  winnings?: number;
  /** Error message if failed */
  error?: string;
  /** Retry count for failed operations */
  retryCount?: number;
  /** Last retry timestamp */
  lastRetry?: number;
}

/**
 * Current state of the game
 */
export interface GameState {
  /** Whether a spin animation is currently running */
  isSpinning: boolean;
  /** ID of the spin currently being displayed */
  currentSpinId: string | null;
  /** Whether waiting for outcome from blockchain */
  waitingForOutcome: boolean;
  /** All queued spins */
  spinQueue: QueuedSpin[];
  /** Current visible grid (3 rows x 5 columns) */
  visibleGrid: SymbolId[][];
  /** User's wallet balance in microVOI */
  balance: number;
  /** Balance reserved for pending spins */
  reservedBalance: number;
  /** Current bet configuration */
  currentBet: {
    betPerLine: number;
    paylines: number;
    totalBet: number;
  };
  /** Whether auto-spin mode is active */
  isAutoSpinning: boolean;
  /** Remaining auto-spins (0 = stopped, -1 = unlimited) */
  autoSpinCount: number;
  /** Last error that occurred */
  lastError: string | null;
}

/**
 * Validation result for bet configuration
 */
export interface ValidationResult {
  /** Whether the bet is valid */
  isValid: boolean;
  /** Error messages if invalid */
  errors: string[];
  /** Warning messages (non-blocking) */
  warnings: string[];
}

/**
 * Bet validation requirements
 */
export interface BetRequirements {
  /** Minimum balance needed for this bet */
  minimumBalance: number;
  /** Estimated total cost including fees */
  estimatedCost: number;
  /** Balance reserved for pending spins */
  pendingReserved: number;
  /** Available balance after pending spins */
  availableBalance: number;
}

/**
 * Game session statistics
 */
export interface SessionStats {
  /** Total spins placed this session */
  totalSpins: number;
  /** Total amount wagered in microVOI */
  totalWagered: number;
  /** Total winnings in microVOI */
  totalWinnings: number;
  /** Net profit/loss in microVOI */
  netProfit: number;
  /** Number of winning spins */
  winCount: number;
  /** Win rate percentage */
  winRate: number;
  /** Largest win this session */
  largestWin: number;
  /** Session start time */
  sessionStart: number;
  /** Session duration in milliseconds */
  sessionDuration: number;
}

/**
 * Spin animation state
 */
export interface SpinAnimation {
  /** Reel index (0-4) */
  reelIndex: number;
  /** Animation duration in ms */
  duration: number;
  /** Animation delay in ms */
  delay: number;
  /** Final symbols for this reel after animation */
  finalSymbols: SymbolId[];
}

/**
 * Payline highlight for UI visualization
 */
export interface PaylineHighlight {
  /** Payline index (0-19) */
  paylineIndex: number;
  /** Pattern being highlighted */
  pattern: PaylinePattern;
  /** Symbol that matches on this payline */
  matchingSymbol: SymbolId;
  /** Number of consecutive matches */
  matchCount: number;
  /** Payout for this payline in microVOI */
  payout: number;
  /** Whether this is currently animating */
  animating: boolean;
}

/**
 * Game configuration state (runtime settings)
 */
export interface GameSettings {
  /** Sound effects enabled */
  soundEnabled: boolean;
  /** Sound volume (0-1) */
  soundVolume: number;
  /** Music enabled */
  musicEnabled: boolean;
  /** Music volume (0-1) */
  musicVolume: number;
  /** Animation speed multiplier */
  animationSpeed: number;
  /** Show provably fair info */
  showProvablyFair: boolean;
  /** Auto-claim winnings */
  autoClaim: boolean;
}
