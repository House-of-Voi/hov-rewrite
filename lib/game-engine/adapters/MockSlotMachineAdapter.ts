/**
 * Mock Slot Machine Adapter
 *
 * Sandbox implementation for testing without blockchain.
 * Provides instant, deterministic outcomes.
 */

import type { BlockchainAdapter } from '../SlotMachineEngine';
import type { BetKey, SpinOutcome, SlotMachineConfig, SymbolId } from '../types';
import { DEFAULT_PAYTABLE, DEFAULT_PAYLINE_PATTERNS, evaluatePaylines } from '../utils/paylineEvaluator';

/**
 * Mock adapter configuration
 */
export interface MockAdapterConfig {
  /** Starting balance in microVOI */
  startingBalance?: number;
  /** Simulate network delay (ms) */
  networkDelay?: number;
  /** Force specific outcomes (for testing) */
  forcedOutcomes?: SymbolId[][][];
  /** RTP percentage (affects outcome generation) */
  rtp?: number;
}

/**
 * Mock blockchain adapter for testing
 */
export class MockSlotMachineAdapter implements BlockchainAdapter {
  private config: MockAdapterConfig;
  private balance: number;
  private currentBlock: number = 1000;
  private pendingBets: Map<string, PendingBet> = new Map();
  private outcomeIndex: number = 0;

  // Mock contract configuration
  private contractConfig: SlotMachineConfig = {
    id: 'mock-slot-machine',
    name: 'Mock Slot Machine',
    displayName: 'Sandbox Slots',
    contractId: BigInt(0),
    chain: 'voi',
    rtpTarget: 96.5,
    houseEdge: 3.5,
    minBet: 1_000_000, // 1 VOI
    maxBet: 100_000_000, // 100 VOI
    maxPaylines: 20,
    reelConfig: {
      reelCount: 5,
      reelLength: 100,
      windowLength: 3,
      reels: this.generateMockReels(),
    },
    paylinePatterns: DEFAULT_PAYLINE_PATTERNS,
    paytable: DEFAULT_PAYTABLE,
    isActive: true,
  };

  constructor(config: MockAdapterConfig = {}) {
    this.config = {
      startingBalance: 10_000_000, // 10 VOI default
      networkDelay: 100, // 100ms default
      rtp: 96.5,
      ...config,
    };

    this.balance = this.config.startingBalance!;
  }

  /**
   * Initialize adapter
   */
  async initialize(): Promise<void> {
    await this.delay(50);
    console.log('🎮 Mock adapter initialized (sandbox mode)');
  }

  /**
   * Submit a spin
   */
  async submitSpin(
    betPerLine: number,
    paylines: number,
    walletAddress: string
  ): Promise<BetKey> {
    await this.delay(this.config.networkDelay);

    const totalBet = betPerLine * paylines;

    // Check balance
    if (this.balance < totalBet) {
      throw new Error('Insufficient balance');
    }

    // Deduct bet from balance
    this.balance -= totalBet;

    // Generate bet key
    const betKey = this.generateBetKey();
    const submitBlock = this.currentBlock;
    const claimBlock = this.currentBlock + 1; // Next block

    // Store pending bet
    this.pendingBets.set(betKey, {
      betKey,
      betPerLine,
      paylines,
      totalBet,
      submitBlock,
      claimBlock,
      walletAddress,
    });

    console.log(`📝 Mock spin submitted: ${betKey.slice(0, 16)}...`);

    return {
      key: betKey,
      txId: `mock_tx_${Date.now()}`,
      submitBlock,
      claimBlock,
    };
  }

  /**
   * Claim spin outcome
   */
  async claimSpin(betKey: string): Promise<SpinOutcome> {
    await this.delay(this.config.networkDelay);

    const pendingBet = this.pendingBets.get(betKey);
    if (!pendingBet) {
      throw new Error('Bet not found');
    }

    // Advance to claim block
    if (this.currentBlock < pendingBet.claimBlock) {
      this.currentBlock = pendingBet.claimBlock;
    }

    // Generate outcome
    const outcome = await this.generateOutcome(pendingBet);

    // Add winnings to balance
    this.balance += outcome.totalPayout;

    // Remove from pending
    this.pendingBets.delete(betKey);

    console.log(
      `🎰 Mock outcome: ${outcome.totalPayout > 0 ? `WON ${outcome.totalPayout / 1_000_000} VOI` : 'LOST'}`
    );

    return outcome;
  }

  /**
   * Get balance
   */
  async getBalance(address: string): Promise<number> {
    void address;
    return this.balance;
  }

  /**
   * Get current block
   */
  async getCurrentBlock(): Promise<number> {
    return this.currentBlock;
  }

  /**
   * Get contract configuration
   */
  async getContractConfig(): Promise<SlotMachineConfig> {
    return this.contractConfig;
  }

  // ============================================================================
  // MOCK HELPERS
  // ============================================================================

  /**
   * Generate mock outcome
   */
  private async generateOutcome(bet: PendingBet): Promise<SpinOutcome> {
    // Use forced outcome if available
    if (this.config.forcedOutcomes && this.outcomeIndex < this.config.forcedOutcomes.length) {
      const forcedGrid = this.config.forcedOutcomes[this.outcomeIndex];
      this.outcomeIndex++;

      return this.createOutcomeFromGrid(forcedGrid, bet);
    }

    // Generate random outcome based on RTP
    const shouldWin = Math.random() * 100 < (this.config.rtp! * 0.3); // Adjusted win rate

    if (shouldWin) {
      return this.generateWinningOutcome(bet);
    } else {
      return this.generateLosingOutcome(bet);
    }
  }

  /**
   * Generate winning outcome
   */
  private async generateWinningOutcome(bet: PendingBet): Promise<SpinOutcome> {
    // Generate a grid with at least one winning line
    const winType = Math.random();

    let grid: SymbolId[][];

    if (winType < 0.05) {
      // 5% chance: Big win (5-of-a-kind)
      grid = this.generateBigWinGrid();
    } else if (winType < 0.20) {
      // 15% chance: Medium win (4-of-a-kind)
      grid = this.generateMediumWinGrid();
    } else {
      // 80% chance: Small win (3-of-a-kind)
      grid = this.generateSmallWinGrid();
    }

    return this.createOutcomeFromGrid(grid, bet);
  }

  /**
   * Generate losing outcome
   */
  private async generateLosingOutcome(bet: PendingBet): Promise<SpinOutcome> {
    // Generate random grid with no wins
    let grid: SymbolId[][];
    let attempts = 0;

    do {
      grid = this.generateRandomGrid();
      attempts++;
    } while (this.hasWinningLines(grid, bet) && attempts < 10);

    return this.createOutcomeFromGrid(grid, bet);
  }

  /**
   * Generate grid with 5-of-a-kind win
   */
  private generateBigWinGrid(): SymbolId[][] {
    const symbols: SymbolId[] = ['A', 'B', 'C', 'D'];
    const winningSymbol = symbols[Math.floor(Math.random() * symbols.length)];
    const paylineIndex = Math.floor(Math.random() * 5); // Use first 5 paylines

    const grid: SymbolId[][] = this.generateRandomGrid();

    // Place winning symbol along selected payline
    const pattern = DEFAULT_PAYLINE_PATTERNS[paylineIndex];
    for (let reel = 0; reel < 5; reel++) {
      grid[reel][pattern[reel]] = winningSymbol;
    }

    return grid;
  }

  /**
   * Generate grid with 4-of-a-kind win
   */
  private generateMediumWinGrid(): SymbolId[][] {
    const symbols: SymbolId[] = ['A', 'B', 'C', 'D'];
    const winningSymbol = symbols[Math.floor(Math.random() * symbols.length)];
    const paylineIndex = Math.floor(Math.random() * 10);

    const grid: SymbolId[][] = this.generateRandomGrid();

    // Place winning symbol on first 4 reels
    const pattern = DEFAULT_PAYLINE_PATTERNS[paylineIndex];
    for (let reel = 0; reel < 4; reel++) {
      grid[reel][pattern[reel]] = winningSymbol;
    }

    return grid;
  }

  /**
   * Generate grid with 3-of-a-kind win
   */
  private generateSmallWinGrid(): SymbolId[][] {
    const symbols: SymbolId[] = ['B', 'C', 'D']; // Lower value symbols
    const winningSymbol = symbols[Math.floor(Math.random() * symbols.length)];
    const paylineIndex = Math.floor(Math.random() * 20);

    const grid: SymbolId[][] = this.generateRandomGrid();

    // Place winning symbol on first 3 reels
    const pattern = DEFAULT_PAYLINE_PATTERNS[paylineIndex];
    for (let reel = 0; reel < 3; reel++) {
      grid[reel][pattern[reel]] = winningSymbol;
    }

    return grid;
  }

  /**
   * Generate random grid
   */
  private generateRandomGrid(): SymbolId[][] {
    const symbols: SymbolId[] = ['A', 'B', 'C', 'D', '_'];
    const grid: SymbolId[][] = [];

    for (let reel = 0; reel < 5; reel++) {
      const reelSymbols: SymbolId[] = [];
      for (let row = 0; row < 3; row++) {
        reelSymbols.push(symbols[Math.floor(Math.random() * symbols.length)]);
      }
      grid.push(reelSymbols);
    }

    return grid;
  }

  /**
   * Check if grid has winning lines
   */
  private hasWinningLines(grid: SymbolId[][], bet: PendingBet): boolean {
    const selectedPaylines = DEFAULT_PAYLINE_PATTERNS.slice(0, bet.paylines);
    const winningLines = evaluatePaylines(
      grid,
      selectedPaylines,
      DEFAULT_PAYTABLE,
      bet.betPerLine
    );
    return winningLines.length > 0;
  }

  /**
   * Create outcome from grid
   */
  private createOutcomeFromGrid(grid: SymbolId[][], bet: PendingBet): SpinOutcome {
    // Evaluate paylines
    const selectedPaylines = DEFAULT_PAYLINE_PATTERNS.slice(0, bet.paylines);
    const winningLines = evaluatePaylines(
      grid,
      selectedPaylines,
      DEFAULT_PAYTABLE,
      bet.betPerLine
    );

    const totalPayout = winningLines.reduce((sum, line) => sum + line.payout, 0);

    // Generate mock block seed and bet key
    const blockSeed = `0x${this.generateRandomHex(64)}`;

    return {
      grid,
      winningLines,
      totalPayout,
      blockNumber: this.currentBlock,
      blockSeed,
      betKey: bet.betKey,
    };
  }

  /**
   * Generate mock reels
   */
  private generateMockReels(): SymbolId[][] {
    const reels: SymbolId[][] = [];

    // Distribution for each symbol
    const distribution = {
      A: 5,   // Rare
      B: 15,  // Uncommon
      C: 25,  // Common
      D: 30,  // Common
      _: 25,  // Blank
    };

    for (let reelIndex = 0; reelIndex < 5; reelIndex++) {
      const reel: SymbolId[] = [];

      // Fill reel based on distribution
      for (const [symbol, count] of Object.entries(distribution)) {
        for (let i = 0; i < count; i++) {
          reel.push(symbol as SymbolId);
        }
      }

      // Shuffle reel
      for (let i = reel.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [reel[i], reel[j]] = [reel[j], reel[i]];
      }

      reels.push(reel);
    }

    return reels;
  }

  /**
   * Generate bet key
   */
  private generateBetKey(): string {
    return `0x${this.generateRandomHex(56)}`;
  }

  /**
   * Generate random hex string
   */
  private generateRandomHex(length: number): string {
    let result = '';
    const chars = '0123456789abcdef';
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  /**
   * Delay helper
   */
  private delay(ms: number = 0): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ============================================================================
  // PUBLIC HELPERS (for testing)
  // ============================================================================

  /**
   * Set balance (for testing)
   */
  setBalance(balance: number): void {
    this.balance = balance;
  }

  /**
   * Advance block (for testing)
   */
  advanceBlock(): void {
    this.currentBlock++;
  }

  /**
   * Get pending bets count (for testing)
   */
  getPendingBetsCount(): number {
    return this.pendingBets.size;
  }
}

/**
 * Pending bet data
 */
interface PendingBet {
  betKey: string;
  betPerLine: number;
  paylines: number;
  totalBet: number;
  submitBlock: number;
  claimBlock: number;
  walletAddress: string;
}
