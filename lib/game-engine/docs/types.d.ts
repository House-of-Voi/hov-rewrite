/**
 * House of Voi - Slot Machine TypeScript Definitions
 *
 * Import these types into your TypeScript project:
 *
 * ```typescript
 * import type {
 *   SlotMachineEngine,
 *   EngineConfig,
 *   SpinResult,
 *   GameState
 * } from '@houseofvoi/slot-machine';
 * ```
 */

declare module '@houseofvoi/slot-machine' {
  // ============================================================================
  // MAIN ENGINE
  // ============================================================================

  /**
   * Main slot machine engine class
   */
  export class SlotMachineEngine {
    /**
     * Create a new slot machine engine instance
     * @param config - Engine configuration
     */
    constructor(config: EngineConfig);

    /**
     * Initialize the engine (must be called before other methods)
     * @throws {Error} If initialization fails
     */
    initialize(): Promise<void>;

    /**
     * Place a spin
     * @param betAmount - Bet per line in microVOI (1 VOI = 1,000,000)
     * @param paylines - Number of paylines to play (1-20)
     * @returns Spin ID for tracking
     * @throws {Error} If bet is invalid or balance insufficient
     */
    spin(betAmount: number, paylines: number): Promise<string>;

    /**
     * Get current game state
     */
    getState(): GameState;

    /**
     * Get slot machine configuration
     */
    getConfig(): SlotConfig;

    /**
     * Get current balance
     */
    getBalance(): Promise<number>;

    /**
     * Get pending spins
     */
    getPendingSpins(): PendingSpin[];

    /**
     * Reset engine to initial state
     */
    reset(): void;

    // Event Listeners

    /**
     * Called when spin outcome is ready
     * @param callback - Callback function
     * @returns Unsubscribe function
     */
    onOutcome(callback: (result: SpinResult) => void): () => void;

    /**
     * Called when balance changes
     * @param callback - Callback function
     * @returns Unsubscribe function
     */
    onBalanceUpdate(callback: (balance: number, previous: number) => void): () => void;

    /**
     * Called when spin starts
     * @param callback - Callback function
     * @returns Unsubscribe function
     */
    onSpinStart(callback: (spinId: string, bet: BetInfo) => void): () => void;

    /**
     * Called when spin is submitted to blockchain
     * @param callback - Callback function
     * @returns Unsubscribe function
     */
    onSpinSubmitted(callback: (spinId: string, txId: string) => void): () => void;

    /**
     * Called when an error occurs
     * @param callback - Callback function
     * @returns Unsubscribe function
     */
    onError(callback: (error: GameError) => void): () => void;

    /**
     * Called when game state changes
     * @param callback - Callback function
     * @returns Unsubscribe function
     */
    onStateChange(callback: (state: GameState) => void): () => void;
  }

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  /**
   * Engine configuration
   */
  export interface EngineConfig {
    /** Contract application ID on blockchain */
    contractId: string;

    /** Blockchain network */
    chain: 'voi';

    /** Use sandbox mode (no real transactions) */
    sandbox?: boolean;

    /** Wallet provider name (production only) */
    walletProvider?: string;

    /** Custom RPC URL */
    rpcUrl?: string;

    /** Auto-connect wallet on init */
    autoConnect?: boolean;
  }

  /**
   * Slot machine configuration
   */
  export interface SlotConfig {
    /** Contract ID */
    contractId: string;

    /** Machine name */
    name: string;

    /** Display name */
    displayName: string;

    /** Minimum bet per line (microVOI) */
    minBet: number;

    /** Maximum bet per line (microVOI) */
    maxBet: number;

    /** Maximum number of paylines */
    maxPaylines: number;

    /** Return to player percentage */
    rtpTarget: number;

    /** House edge percentage */
    houseEdge: number;

    /** Paytable configuration */
    paytable: PaytableConfig;

    /** Payline patterns */
    paylinePatterns: PaylinePattern[];

    /** Reel configuration */
    reelConfig: ReelConfig;
  }

  /**
   * Paytable configuration
   */
  export interface PaytableConfig {
    /** Symbol configurations */
    symbols: SymbolConfig[];

    /** Maximum payout multiplier */
    maxPayoutMultiplier: number;
  }

  /**
   * Symbol configuration
   */
  export interface SymbolConfig {
    /** Symbol identifier ('A', 'B', 'C', 'D', '_') */
    symbol: SymbolId;

    /** Display name */
    displayName: string;

    /** Multiplier for 3 matches */
    match3: number;

    /** Multiplier for 4 matches */
    match4: number;

    /** Multiplier for 5 matches */
    match5: number;
  }

  /**
   * Reel configuration
   */
  export interface ReelConfig {
    /** Number of reels (always 5) */
    reelCount: 5;

    /** Symbols per reel (always 100) */
    reelLength: 100;

    /** Visible window size (always 3) */
    windowLength: 3;

    /** Symbol distribution for each reel */
    reels: SymbolId[][];
  }

  /**
   * Payline pattern (Y-coordinates for each reel)
   */
  export type PaylinePattern = [number, number, number, number, number];

  /**
   * Symbol identifier
   */
  export type SymbolId = 'A' | 'B' | 'C' | 'D' | '_';

  // ============================================================================
  // GAME STATE
  // ============================================================================

  /**
   * Current game state
   */
  export interface GameState {
    /** Is a spin in progress? */
    isSpinning: boolean;

    /** Current spin ID (if spinning) */
    currentSpinId: string | null;

    /** Waiting for outcome from blockchain? */
    waitingForOutcome: boolean;

    /** All pending spins */
    spinQueue: QueuedSpin[];

    /** Current visible grid (3x5: 5 reels × 3 symbols) */
    visibleGrid: SymbolId[][];

    /** Current balance in microVOI */
    balance: number;

    /** Balance reserved for pending spins */
    reservedBalance: number;

    /** Available balance (balance - reservedBalance) */
    availableBalance: number;

    /** Number of pending spins */
    pendingSpins: number;

    /** Current bet configuration */
    currentBet: BetInfo;

    /** Is auto-spin active? */
    isAutoSpinning: boolean;

    /** Remaining auto-spins (0 = stopped, -1 = unlimited) */
    autoSpinCount: number;

    /** Last error (if any) */
    lastError: string | null;
  }

  /**
   * Queued spin
   */
  export interface QueuedSpin {
    /** Spin ID */
    id: string;

    /** Current status */
    status: SpinStatus;

    /** Bet per line (microVOI) */
    betPerLine: number;

    /** Number of paylines */
    paylines: number;

    /** Total bet (betPerLine × paylines) */
    totalBet: number;

    /** Timestamp */
    timestamp: number;

    /** Bet key (after submission) */
    betKey?: string;

    /** Transaction ID */
    txId?: string;

    /** Outcome (after claiming) */
    outcome?: SpinOutcome;

    /** Winnings (microVOI) */
    winnings?: number;

    /** Error message (if failed) */
    error?: string;
  }

  /**
   * Spin status
   */
  export enum SpinStatus {
    PENDING = 'PENDING',
    SUBMITTING = 'SUBMITTING',
    WAITING = 'WAITING',
    PROCESSING = 'PROCESSING',
    READY_TO_CLAIM = 'READY_TO_CLAIM',
    CLAIMING = 'CLAIMING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    EXPIRED = 'EXPIRED',
  }

  /**
   * Pending spin info
   */
  export interface PendingSpin {
    /** Spin ID */
    id: string;

    /** Bet amount */
    betAmount: number;

    /** Paylines */
    paylines: number;

    /** Status */
    status: 'submitting' | 'waiting' | 'claiming';

    /** Timestamp */
    timestamp: number;
  }

  /**
   * Bet information
   */
  export interface BetInfo {
    /** Bet per line (microVOI) */
    betPerLine: number;

    /** Number of paylines */
    paylines: number;

    /** Total bet (betPerLine × paylines) */
    totalBet: number;
  }

  // ============================================================================
  // RESULTS
  // ============================================================================

  /**
   * Complete spin result
   */
  export interface SpinResult {
    /** Spin ID */
    spinId: string;

    /** Final grid (3x5: 5 reels × 3 symbols) */
    grid: SymbolId[][];

    /** Total winnings (microVOI) */
    winnings: number;

    /** Is this a win? */
    isWin: boolean;

    /** Winning paylines */
    winningLines: WinningLine[];

    /** Bet per line */
    betPerLine: number;

    /** Paylines played */
    paylines: number;

    /** Total bet */
    totalBet: number;

    /** Net profit (winnings - totalBet) */
    netProfit: number;

    /** Win level for animations */
    winLevel: WinLevel;

    /** Block number */
    blockNumber: number;

    /** Block seed (for provably fair verification) */
    blockSeed: string;

    /** Bet key (for provably fair verification) */
    betKey: string;

    /** Timestamp */
    timestamp: number;

    /** Transaction ID */
    txId: string;
  }

  /**
   * Spin outcome from blockchain
   */
  export interface SpinOutcome {
    /** Final grid */
    grid: SymbolId[][];

    /** Winning lines */
    winningLines: WinningLine[];

    /** Total payout (microVOI) */
    totalPayout: number;

    /** Block number */
    blockNumber: number;

    /** Block seed */
    blockSeed: string;

    /** Bet key */
    betKey: string;
  }

  /**
   * A winning payline
   */
  export interface WinningLine {
    /** Payline index (0-19) */
    paylineIndex: number;

    /** Payline pattern */
    pattern: PaylinePattern;

    /** Matching symbol */
    symbol: SymbolId;

    /** Number of consecutive matches (3, 4, or 5) */
    matchCount: number;

    /** Payout for this line (microVOI) */
    payout: number;
  }

  /**
   * Win level (for celebrations)
   */
  export type WinLevel = 'small' | 'medium' | 'large' | 'jackpot';

  // ============================================================================
  // ERRORS
  // ============================================================================

  /**
   * Game error
   */
  export interface GameError {
    /** Error code */
    code: ErrorCode;

    /** Human-readable message */
    message: string;

    /** Additional details */
    details?: unknown;

    /** Can user retry? */
    recoverable: boolean;
  }

  /**
   * Error codes
   */
  export type ErrorCode =
    | 'INSUFFICIENT_BALANCE'
    | 'INVALID_BET'
    | 'NETWORK_ERROR'
    | 'TRANSACTION_FAILED'
    | 'CONTRACT_ERROR'
    | 'NOT_INITIALIZED'
    | 'TIMEOUT'
    | 'UNKNOWN';

  // ============================================================================
  // PROVABLY FAIR
  // ============================================================================

  /**
   * Provably fair verification data
   */
  export interface ProvablyFairData {
    /** Bet key */
    betKey: string;

    /** Block seed */
    blockSeed: string;

    /** Block number */
    blockNumber: number;

    /** Computed reel positions */
    reelTops: number[];

    /** Resulting grid */
    grid: SymbolId[][];

    /** Is verified? */
    verified: boolean;

    /** Verification steps */
    verificationSteps: VerificationStep[];
  }

  /**
   * Verification step
   */
  export interface VerificationStep {
    /** Step description */
    step: string;

    /** Step value */
    value: string;
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Convert microVOI to VOI
   * @param microVOI - Amount in microVOI
   * @returns Amount in VOI
   */
  export function formatVOI(microVOI: number): string;

  /**
   * Convert VOI to microVOI
   * @param voi - Amount in VOI
   * @returns Amount in microVOI
   */
  export function parseVOI(voi: string): number;

  /**
   * Verify a spin outcome
   * @param result - Spin result to verify
   * @returns Verification data
   */
  export function verifyOutcome(result: SpinResult): Promise<ProvablyFairData>;

  /**
   * Generate verification link
   * @param result - Spin result
   * @returns URL for verification
   */
  export function generateVerificationLink(result: SpinResult): string;

  // ============================================================================
  // CONSTANTS
  // ============================================================================

  /**
   * Microunits per VOI
   */
  export const MICRO_VOI = 1_000_000;

  /**
   * Default paytable
   */
  export const DEFAULT_PAYTABLE: PaytableConfig;

  /**
   * Default payline patterns (20 lines)
   */
  export const DEFAULT_PAYLINES: PaylinePattern[];

  /**
   * Symbol display names
   */
  export const SYMBOL_NAMES: Record<SymbolId, string>;
}

// ============================================================================
// GLOBAL NAMESPACE (for CDN usage)
// ============================================================================

declare global {
  interface Window {
    HouseOfVoi: {
      SlotMachineEngine: typeof import('@houseofvoi/slot-machine').SlotMachineEngine;
      formatVOI: typeof import('@houseofvoi/slot-machine').formatVOI;
      parseVOI: typeof import('@houseofvoi/slot-machine').parseVOI;
      verifyOutcome: typeof import('@houseofvoi/slot-machine').verifyOutcome;
      MICRO_VOI: typeof import('@houseofvoi/slot-machine').MICRO_VOI;
    };
  }
}

export {};
