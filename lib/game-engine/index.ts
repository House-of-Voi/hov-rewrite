/**
 * House of Voi - Slot Machine Game Engine
 *
 * Main exports for the game engine middleware.
 */

// Main Engine
export { SlotMachineEngine } from './SlotMachineEngine';
export type { BlockchainAdapter } from './SlotMachineEngine';

// Adapters
export { MockSlotMachineAdapter, VoiSlotMachineAdapter } from './adapters';
export type { MockAdapterConfig, VoiAdapterConfig } from './adapters';

// Types
export type {
  // Configuration
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

  // State
  QueuedSpin,
  GameState,
  ValidationResult,
  BetRequirements,
  SessionStats,
  SpinAnimation,
  PaylineHighlight,
  GameSettings,

  // Result types
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

  // Event types
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

  // Error types
  ErrorCode,
  GameError,
} from './types';

export { GameEventType, SpinStatus } from './types';

// Utilities
export {
  // Grid generation
  generateGrid,
  getReelWindow,
  generateReelTopsFromSeed,
  bytesToHex,
  getSymbolAt,
  formatGrid,

  // Payline evaluation
  evaluatePaylines,
  evaluatePayline,
  getPayoutMultiplier,
  calculateTotalPayout,
  getPaylineSymbols,
  paylineMatches,
  DEFAULT_PAYTABLE,
  DEFAULT_PAYLINE_PATTERNS,

  // Validation
  validateBet,
  validateBalance,
  calculateReservedBalance,
  validateContractOperational,
  formatVOI,
  parseVOI,
  validateSpinClaimable,
  validateBetSafety,

  // Provably fair
  verifySpinOutcome,
  generateVerificationLink,
  formatVerificationData,
  sha256,
  verifyBlockSeed,
  createFairnessCertificate,
} from './utils';

// Result helpers (from types)
export { getWinLevel, isWinningResult } from './types';

// Constants
export const MICRO_VOI = 1_000_000;

export const SYMBOL_NAMES: Record<string, string> = {
  A: 'Diamond',
  B: 'Gold',
  C: 'Silver',
  D: 'Bronze',
  _: 'Blank',
};
