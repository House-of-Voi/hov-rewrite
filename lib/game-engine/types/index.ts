/**
 * Game Engine Types
 *
 * Central export for all type definitions used in the slot machine game engine.
 */

// Configuration types
export type {
  EngineConfig,
  ChainType,
  SymbolId,
  PaylinePattern,
  SymbolPayouts,
  PaytableConfig,
  ReelConfig,
  SlotMachineConfig,
  ContractState,
  TransactionFees,
  BettingLimits,
} from './config';
export { DEFAULT_TRANSACTION_FEES } from './config';

// State types
export type {
  QueuedSpin,
  GameState,
  ValidationResult,
  BetRequirements,
  SessionStats,
  SpinAnimation,
  PaylineHighlight,
  GameSettings,
} from './state';
export { SpinStatus } from './state';

// Result types
export type {
  WinLevel,
  WinningLine,
  SpinOutcome,
  SpinResult,
  TransactionResult,
  SpinParams,
  BetKey,
  ClaimResult,
  ProvablyFairData,
  BalanceInfo,
  WinCelebration,
} from './results';
export { getWinLevel, isWinningResult } from './results';

// Event types
export type {
  BaseGameEvent,
  GameInitializedEvent,
  SpinQueuedEvent,
  SpinSubmittedEvent,
  SpinWaitingEvent,
  SpinClaimedEvent,
  SpinCompletedEvent,
  SpinFailedEvent,
  AnimationStartedEvent,
  AnimationStoppedEvent,
  ReelStoppedEvent,
  BalanceUpdatedEvent,
  BalanceInsufficientEvent,
  WinEvent,
  StateChangedEvent,
  BetChangedEvent,
  AutoSpinStartedEvent,
  AutoSpinStoppedEvent,
  AutoSpinCompletedEvent,
  ErrorEvent,
  GameEvent,
  EventListener,
  Unsubscribe,
  EventEmitter,
} from './events';
export { GameEventType } from './events';

// Error types
export type { ErrorCode, GameError } from './errors';
