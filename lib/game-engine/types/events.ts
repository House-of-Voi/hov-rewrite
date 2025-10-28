/**
 * Game Event Types
 *
 * These types define all events that can be emitted by the game engine.
 */

import type { GameState, QueuedSpin } from './state';
import type { SpinResult, SpinOutcome, BalanceInfo } from './results';
import type { GameError } from './errors';

/**
 * Event type enumeration
 */
export enum GameEventType {
  // Initialization
  GAME_INITIALIZED = 'game:initialized',
  GAME_CONFIG_LOADED = 'game:config-loaded',

  // Spin Lifecycle
  SPIN_QUEUED = 'spin:queued',
  SPIN_SUBMITTED = 'spin:submitted',
  SPIN_WAITING = 'spin:waiting',
  SPIN_CLAIMED = 'spin:claimed',
  SPIN_COMPLETED = 'spin:completed',
  SPIN_FAILED = 'spin:failed',

  // Animation
  ANIMATION_STARTED = 'animation:started',
  ANIMATION_STOPPED = 'animation:stopped',
  REEL_STOPPED = 'reel:stopped',

  // Balance
  BALANCE_UPDATED = 'balance:updated',
  BALANCE_INSUFFICIENT = 'balance:insufficient',

  // Wins
  WIN_SMALL = 'win:small',
  WIN_MEDIUM = 'win:medium',
  WIN_LARGE = 'win:large',
  WIN_JACKPOT = 'win:jackpot',

  // State Changes
  STATE_CHANGED = 'state:changed',
  BET_CHANGED = 'bet:changed',

  // Auto Spin
  AUTO_SPIN_STARTED = 'auto-spin:started',
  AUTO_SPIN_STOPPED = 'auto-spin:stopped',
  AUTO_SPIN_COMPLETED = 'auto-spin:completed',

  // Errors
  ERROR_OCCURRED = 'error:occurred',
  ERROR_TRANSACTION_FAILED = 'error:transaction-failed',
  ERROR_INSUFFICIENT_BALANCE = 'error:insufficient-balance',
  ERROR_INVALID_BET = 'error:invalid-bet',
  ERROR_CONTRACT_ERROR = 'error:contract-error',
}

/**
 * Base event structure
 */
export interface BaseGameEvent {
  type: GameEventType;
  timestamp: number;
}

/**
 * Game initialized event
 */
export interface GameInitializedEvent extends BaseGameEvent {
  type: GameEventType.GAME_INITIALIZED;
  payload: {
    contractId: bigint;
    chain: string;
  };
}

/**
 * Spin queued event
 */
export interface SpinQueuedEvent extends BaseGameEvent {
  type: GameEventType.SPIN_QUEUED;
  payload: {
    spin: QueuedSpin;
  };
}

/**
 * Spin submitted event
 */
export interface SpinSubmittedEvent extends BaseGameEvent {
  type: GameEventType.SPIN_SUBMITTED;
  payload: {
    spinId: string;
    txId: string;
    betKey: string;
    submitBlock: number;
    claimBlock: number;
  };
}

/**
 * Spin waiting event
 */
export interface SpinWaitingEvent extends BaseGameEvent {
  type: GameEventType.SPIN_WAITING;
  payload: {
    spinId: string;
    claimBlock: number;
    currentBlock: number;
    blocksRemaining: number;
  };
}

/**
 * Spin claimed event
 */
export interface SpinClaimedEvent extends BaseGameEvent {
  type: GameEventType.SPIN_CLAIMED;
  payload: {
    spinId: string;
    outcome: SpinOutcome;
    payout: number;
  };
}

/**
 * Spin completed event
 */
export interface SpinCompletedEvent extends BaseGameEvent {
  type: GameEventType.SPIN_COMPLETED;
  payload: {
    result: SpinResult;
  };
}

/**
 * Spin failed event
 */
export interface SpinFailedEvent extends BaseGameEvent {
  type: GameEventType.SPIN_FAILED;
  payload: {
    spinId: string;
    error: string;
    retryable: boolean;
  };
}

/**
 * Animation started event
 */
export interface AnimationStartedEvent extends BaseGameEvent {
  type: GameEventType.ANIMATION_STARTED;
  payload: {
    spinId: string;
  };
}

/**
 * Animation stopped event
 */
export interface AnimationStoppedEvent extends BaseGameEvent {
  type: GameEventType.ANIMATION_STOPPED;
  payload: {
    spinId: string;
    grid: string[][];
  };
}

/**
 * Reel stopped event
 */
export interface ReelStoppedEvent extends BaseGameEvent {
  type: GameEventType.REEL_STOPPED;
  payload: {
    reelIndex: number;
    symbols: string[];
  };
}

/**
 * Balance updated event
 */
export interface BalanceUpdatedEvent extends BaseGameEvent {
  type: GameEventType.BALANCE_UPDATED;
  payload: {
    balance: BalanceInfo;
    previousBalance: number;
    change: number;
  };
}

/**
 * Balance insufficient event
 */
export interface BalanceInsufficientEvent extends BaseGameEvent {
  type: GameEventType.BALANCE_INSUFFICIENT;
  payload: {
    required: number;
    available: number;
    deficit: number;
  };
}

/**
 * Win event (all levels)
 */
export interface WinEvent extends BaseGameEvent {
  type: GameEventType.WIN_SMALL | GameEventType.WIN_MEDIUM | GameEventType.WIN_LARGE | GameEventType.WIN_JACKPOT;
  payload: {
    result: SpinResult;
    winAmount: number;
    multiplier: number;
  };
}

/**
 * State changed event
 */
export interface StateChangedEvent extends BaseGameEvent {
  type: GameEventType.STATE_CHANGED;
  payload: {
    state: GameState;
    previousState?: Partial<GameState>;
  };
}

/**
 * Bet changed event
 */
export interface BetChangedEvent extends BaseGameEvent {
  type: GameEventType.BET_CHANGED;
  payload: {
    betPerLine: number;
    paylines: number;
    totalBet: number;
  };
}

/**
 * Auto spin events
 */
export interface AutoSpinStartedEvent extends BaseGameEvent {
  type: GameEventType.AUTO_SPIN_STARTED;
  payload: {
    count: number; // -1 for unlimited
  };
}

export interface AutoSpinStoppedEvent extends BaseGameEvent {
  type: GameEventType.AUTO_SPIN_STOPPED;
  payload: {
    reason: 'user' | 'completed' | 'insufficient-balance' | 'error';
  };
}

export interface AutoSpinCompletedEvent extends BaseGameEvent {
  type: GameEventType.AUTO_SPIN_COMPLETED;
  payload: {
    totalSpins: number;
    totalWagered: number;
    totalWon: number;
    netProfit: number;
  };
}

/**
 * Error event
 */
export interface ErrorEvent extends BaseGameEvent {
  type: GameEventType.ERROR_OCCURRED
    | GameEventType.ERROR_TRANSACTION_FAILED
    | GameEventType.ERROR_INSUFFICIENT_BALANCE
    | GameEventType.ERROR_INVALID_BET
    | GameEventType.ERROR_CONTRACT_ERROR;
  payload: {
    error: GameError;
  };
}

/**
 * Union type of all possible game events
 */
export type GameEvent =
  | GameInitializedEvent
  | SpinQueuedEvent
  | SpinSubmittedEvent
  | SpinWaitingEvent
  | SpinClaimedEvent
  | SpinCompletedEvent
  | SpinFailedEvent
  | AnimationStartedEvent
  | AnimationStoppedEvent
  | ReelStoppedEvent
  | BalanceUpdatedEvent
  | BalanceInsufficientEvent
  | WinEvent
  | StateChangedEvent
  | BetChangedEvent
  | AutoSpinStartedEvent
  | AutoSpinStoppedEvent
  | AutoSpinCompletedEvent
  | ErrorEvent;

/**
 * Event listener callback type
 */
export type EventListener<T extends GameEvent = GameEvent> = (event: T) => void;

/**
 * Unsubscribe function type
 */
export type Unsubscribe = () => void;

/**
 * Event emitter interface
 */
export interface EventEmitter {
  on<T extends GameEvent>(type: GameEventType, listener: EventListener<T>): Unsubscribe;
  off<T extends GameEvent>(type: GameEventType, listener: EventListener<T>): void;
  emit(event: GameEvent): void;
  removeAllListeners(type?: GameEventType): void;
}
