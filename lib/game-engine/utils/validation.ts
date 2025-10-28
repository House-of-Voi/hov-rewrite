/**
 * Validation Utility
 *
 * Validates bets, balance requirements, and game state.
 */

import type {
  ValidationResult,
  BetRequirements,
  QueuedSpin,
  SlotMachineConfig,
} from '../types';
import { SpinStatus } from '../types';
import { DEFAULT_TRANSACTION_FEES } from '../types/config';

/**
 * Validate a bet configuration
 *
 * @param betPerLine - Bet amount per line in microVOI
 * @param paylines - Number of paylines (1-20)
 * @param config - Slot machine configuration
 * @returns Validation result
 */
export function validateBet(
  betPerLine: number,
  paylines: number,
  config: SlotMachineConfig
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate bet per line
  if (betPerLine < config.minBet) {
    errors.push(`Minimum bet per line is ${formatVOI(config.minBet)} VOI`);
  }

  if (betPerLine > config.maxBet) {
    errors.push(`Maximum bet per line is ${formatVOI(config.maxBet)} VOI`);
  }

  if (betPerLine % 1000000 !== 0) {
    warnings.push('Bet amounts should be whole VOI amounts for best results');
  }

  // Validate paylines
  if (paylines < 1) {
    errors.push('Must select at least 1 payline');
  }

  if (paylines > config.maxPaylines) {
    errors.push(`Maximum ${config.maxPaylines} paylines allowed`);
  }

  if (!Number.isInteger(paylines)) {
    errors.push('Paylines must be a whole number');
  }

  // Validate total bet
  const totalBet = betPerLine * paylines;
  const maxTotalBet = config.maxBet * config.maxPaylines;

  if (totalBet > maxTotalBet) {
    errors.push(`Total bet cannot exceed ${formatVOI(maxTotalBet)} VOI`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate sufficient balance for a bet
 *
 * @param betPerLine - Bet amount per line
 * @param paylines - Number of paylines
 * @param balance - Current balance in microVOI
 * @param reservedBalance - Balance reserved for pending spins
 * @returns Validation result with balance requirements
 */
export function validateBalance(
  betPerLine: number,
  paylines: number,
  balance: number,
  reservedBalance: number = 0
): ValidationResult & { requirements: BetRequirements } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const totalBet = betPerLine * paylines;

  // Calculate total costs
  const fees =
    DEFAULT_TRANSACTION_FEES.spinCost +
    DEFAULT_TRANSACTION_FEES.boxCost +
    DEFAULT_TRANSACTION_FEES.networkFee +
    DEFAULT_TRANSACTION_FEES.buffer;

  const estimatedCost = totalBet + fees;
  const availableBalance = balance - reservedBalance;

  // Check available balance
  if (availableBalance < estimatedCost) {
    errors.push(
      `Insufficient balance. Need ${formatVOI(estimatedCost)} VOI (including fees), ` +
        `but only ${formatVOI(availableBalance)} VOI available`
    );
  }

  // Warn if balance is getting low
  if (availableBalance < estimatedCost * 2) {
    warnings.push('Balance is running low. Consider depositing more funds.');
  }

  // Warn if high percentage of balance is reserved
  if (reservedBalance > balance * 0.5) {
    warnings.push(`${formatVOI(reservedBalance)} VOI reserved for ${getPendingSpinCount(reservedBalance, totalBet)} pending spins`);
  }

  const requirements: BetRequirements = {
    minimumBalance: estimatedCost,
    estimatedCost,
    pendingReserved: reservedBalance,
    availableBalance,
  };

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    requirements,
  };
}

/**
 * Calculate reserved balance from pending spins
 *
 * @param spins - Array of queued spins
 * @returns Total reserved balance in microVOI
 */
export function calculateReservedBalance(spins: QueuedSpin[]): number {
  return spins
    .filter(
      (spin) =>
        spin.status !== SpinStatus.COMPLETED &&
        spin.status !== SpinStatus.FAILED &&
        spin.status !== SpinStatus.EXPIRED
    )
    .reduce((total, spin) => total + spin.totalBet, 0);
}

/**
 * Estimate pending spin count from reserved balance
 */
function getPendingSpinCount(reservedBalance: number, avgBet: number): number {
  if (avgBet === 0) return 0;
  return Math.ceil(reservedBalance / avgBet);
}

/**
 * Validate contract is operational
 *
 * @param minBalance - Minimum balance contract should have
 * @param contractBalance - Current contract balance
 * @returns Validation result
 */
export function validateContractOperational(
  minBalance: bigint,
  contractBalance: bigint
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (contractBalance < minBalance) {
    errors.push(
      'Slot machine is temporarily unavailable due to low liquidity. Please try again later.'
    );
  }

  if (contractBalance < minBalance * 2n) {
    warnings.push('Contract liquidity is low. Large wins may take longer to process.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Format microVOI to VOI string
 */
export function formatVOI(microVOI: number): string {
  return (microVOI / 1_000_000).toFixed(2);
}

/**
 * Parse VOI string to microVOI
 */
export function parseVOI(voi: string): number {
  const parsed = parseFloat(voi);
  if (isNaN(parsed)) {
    throw new Error('Invalid VOI amount');
  }
  return Math.round(parsed * 1_000_000);
}

/**
 * Validate spin is claimable
 *
 * @param spin - Queued spin
 * @param currentBlock - Current blockchain block number
 * @returns Validation result
 */
export function validateSpinClaimable(
  spin: QueuedSpin,
  currentBlock: number
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!spin.claimBlock) {
    errors.push('Spin has not been submitted yet');
  } else if (currentBlock < spin.claimBlock) {
    errors.push(
      `Must wait for block ${spin.claimBlock} (current: ${currentBlock}, ${spin.claimBlock - currentBlock} blocks remaining)`
    );
  }

  if (spin.status === SpinStatus.COMPLETED) {
    errors.push('Spin has already been claimed');
  }

  if (spin.status === SpinStatus.FAILED) {
    errors.push('Spin failed and cannot be claimed');
  }

  if (spin.status === SpinStatus.EXPIRED) {
    errors.push('Spin claim window has expired');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if a bet amount is safe relative to balance
 *
 * @param totalBet - Total bet amount
 * @param balance - Current balance
 * @returns Validation result
 */
export function validateBetSafety(totalBet: number, balance: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const betPercentage = (totalBet / balance) * 100;

  if (betPercentage > 50) {
    errors.push('Bet is more than 50% of balance. This is very risky.');
  } else if (betPercentage > 25) {
    warnings.push('Bet is more than 25% of balance. Consider betting less.');
  } else if (betPercentage > 10) {
    warnings.push('Bet is more than 10% of balance.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
