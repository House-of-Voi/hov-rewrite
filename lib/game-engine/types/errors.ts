/**
 * Game Engine Error Types
 *
 * Shared error representations used across the game engine.
 */

/**
 * Error codes emitted by the game engine
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

/**
 * Game error information
 */
export interface GameError {
  /** Machine-readable error code */
  code: ErrorCode;
  /** Human-readable error message */
  message: string;
  /** Optional additional details */
  details?: unknown;
  /** Whether the operation can be retried */
  recoverable: boolean;
}
