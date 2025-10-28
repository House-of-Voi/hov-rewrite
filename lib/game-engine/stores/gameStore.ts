/**
 * Game State Store
 *
 * Zustand store for managing game state in React components.
 */

import { create } from 'zustand';
import type { GameState, QueuedSpin, SymbolId } from '../types';
import { SpinStatus } from '../types';
import { calculateReservedBalance } from '../utils/validation';

/**
 * Game store actions
 */
interface GameActions {
  // Spin queue management
  addSpin: (spin: QueuedSpin) => void;
  updateSpin: (id: string, updates: Partial<QueuedSpin>) => void;
  removeSpin: (id: string) => void;
  clearCompletedSpins: () => void;

  // Grid management
  setVisibleGrid: (grid: SymbolId[][]) => void;
  resetGrid: () => void;

  // Spinning state
  setSpinning: (spinning: boolean, spinId?: string) => void;
  setWaitingForOutcome: (waiting: boolean) => void;

  // Balance management
  setBalance: (balance: number) => void;
  updateReservedBalance: () => void;

  // Bet configuration
  setBet: (betPerLine: number, paylines: number) => void;

  // Auto spin
  startAutoSpin: (count: number) => void; // -1 for unlimited
  stopAutoSpin: () => void;
  decrementAutoSpin: () => void;

  // Error handling
  setError: (error: string | null) => void;

  // Reset
  reset: () => void;
}

/**
 * Default reel symbols for initial grid
 */
const DEFAULT_SYMBOLS: SymbolId[] = ['A', 'B', 'C', 'D', '_'];

/**
 * Generate initial grid
 */
function generateInitialGrid(): SymbolId[][] {
  return Array(5)
    .fill(null)
    .map(() =>
      Array(3)
        .fill(null)
        .map((_, i) => DEFAULT_SYMBOLS[i % DEFAULT_SYMBOLS.length])
    );
}

/**
 * Initial game state
 */
const initialState: GameState = {
  isSpinning: false,
  currentSpinId: null,
  waitingForOutcome: false,
  spinQueue: [],
  visibleGrid: generateInitialGrid(),
  balance: 0,
  reservedBalance: 0,
  currentBet: {
    betPerLine: 1_000_000, // 1 VOI
    paylines: 1,
    totalBet: 1_000_000,
  },
  isAutoSpinning: false,
  autoSpinCount: 0,
  lastError: null,
};

/**
 * Game store
 */
export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  // Spin queue management
  addSpin: (spin) => {
    set((state) => ({
      spinQueue: [...state.spinQueue, spin],
    }));
    get().updateReservedBalance();
  },

  updateSpin: (id, updates) => {
    set((state) => ({
      spinQueue: state.spinQueue.map((spin) =>
        spin.id === id ? { ...spin, ...updates } : spin
      ),
    }));
    get().updateReservedBalance();
  },

  removeSpin: (id) => {
    set((state) => ({
      spinQueue: state.spinQueue.filter((spin) => spin.id !== id),
    }));
    get().updateReservedBalance();
  },

  clearCompletedSpins: () => {
    set((state) => ({
      spinQueue: state.spinQueue.filter(
        (spin) =>
          spin.status !== SpinStatus.COMPLETED &&
          spin.status !== SpinStatus.FAILED &&
          spin.status !== SpinStatus.EXPIRED
      ),
    }));
    get().updateReservedBalance();
  },

  // Grid management
  setVisibleGrid: (grid) => {
    set({ visibleGrid: grid });
  },

  resetGrid: () => {
    set({ visibleGrid: generateInitialGrid() });
  },

  // Spinning state
  setSpinning: (spinning, spinId) => {
    set({
      isSpinning: spinning,
      currentSpinId: spinId ?? get().currentSpinId,
    });
  },

  setWaitingForOutcome: (waiting) => {
    set({ waitingForOutcome: waiting });
  },

  // Balance management
  setBalance: (balance) => {
    set({ balance });
  },

  updateReservedBalance: () => {
    const { spinQueue } = get();
    const reserved = calculateReservedBalance(spinQueue);
    set({ reservedBalance: reserved });
  },

  // Bet configuration
  setBet: (betPerLine, paylines) => {
    set({
      currentBet: {
        betPerLine,
        paylines,
        totalBet: betPerLine * paylines,
      },
    });
  },

  // Auto spin
  startAutoSpin: (count) => {
    set({
      isAutoSpinning: true,
      autoSpinCount: count,
    });
  },

  stopAutoSpin: () => {
    set({
      isAutoSpinning: false,
      autoSpinCount: 0,
    });
  },

  decrementAutoSpin: () => {
    const { autoSpinCount } = get();
    if (autoSpinCount === -1) return; // Unlimited

    const newCount = Math.max(0, autoSpinCount - 1);
    set({
      autoSpinCount: newCount,
      isAutoSpinning: newCount > 0,
    });
  },

  // Error handling
  setError: (error) => {
    set({ lastError: error });
  },

  // Reset
  reset: () => {
    set(initialState);
  },
}));

/**
 * Selectors for convenient access to specific state
 */
export const selectIsSpinning = (state: GameState & GameActions) => state.isSpinning;
export const selectCurrentSpinId = (state: GameState & GameActions) => state.currentSpinId;
export const selectSpinQueue = (state: GameState & GameActions) => state.spinQueue;
export const selectVisibleGrid = (state: GameState & GameActions) => state.visibleGrid;
export const selectBalance = (state: GameState & GameActions) => state.balance;
export const selectAvailableBalance = (state: GameState & GameActions) =>
  state.balance - state.reservedBalance;
export const selectCurrentBet = (state: GameState & GameActions) => state.currentBet;
export const selectIsAutoSpinning = (state: GameState & GameActions) => state.isAutoSpinning;
export const selectAutoSpinCount = (state: GameState & GameActions) => state.autoSpinCount;
