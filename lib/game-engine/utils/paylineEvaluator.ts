/**
 * Payline Evaluator Utility
 *
 * Evaluates winning paylines against a grid.
 * Ported from the slot machine contract payout logic.
 */

import type { SymbolId, PaylinePattern, PaytableConfig } from '../types/config';
import type { WinningLine } from '../types/results';
import { getSymbolAt } from './gridGenerator';

/**
 * Evaluate all paylines against a grid to find winners
 *
 * @param grid - 3x5 grid of symbols
 * @param paylinePatterns - Array of payline patterns to evaluate
 * @param paytable - Payout configuration
 * @param betPerLine - Bet amount per line in microVOI
 * @returns Array of winning lines with payouts
 */
export function evaluatePaylines(
  grid: SymbolId[][],
  paylinePatterns: PaylinePattern[],
  paytable: PaytableConfig,
  betPerLine: number
): WinningLine[] {
  const winningLines: WinningLine[] = [];

  for (let i = 0; i < paylinePatterns.length; i++) {
    const pattern = paylinePatterns[i];
    const result = evaluatePayline(grid, pattern, paytable, betPerLine);

    if (result) {
      winningLines.push({
        paylineIndex: i,
        pattern,
        symbol: result.symbol,
        matchCount: result.matchCount,
        payout: result.payout,
      });
    }
  }

  return winningLines;
}

/**
 * Evaluate a single payline
 *
 * @param grid - 3x5 grid of symbols
 * @param pattern - Payline pattern (5 y-coordinates)
 * @param paytable - Payout configuration
 * @param betPerLine - Bet amount per line in microVOI
 * @returns Winning line result or null if no win
 */
export function evaluatePayline(
  grid: SymbolId[][],
  pattern: PaylinePattern,
  paytable: PaytableConfig,
  betPerLine: number
): { symbol: SymbolId; matchCount: number; payout: number } | null {
  // Get symbols along the payline
  const symbols: SymbolId[] = [];
  for (let reelIndex = 0; reelIndex < 5; reelIndex++) {
    const row = pattern[reelIndex];
    symbols.push(getSymbolAt(grid, reelIndex, row));
  }

  // Count consecutive matching symbols from left to right
  const firstSymbol = symbols[0];

  // Blank symbols don't pay
  if (firstSymbol === '_') {
    return null;
  }

  let matchCount = 1;
  for (let i = 1; i < 5; i++) {
    if (symbols[i] === firstSymbol) {
      matchCount++;
    } else {
      break; // Stop at first non-match
    }
  }

  // Need at least 3 consecutive matches to win
  if (matchCount < 3) {
    return null;
  }

  // Look up payout multiplier
  const multiplier = getPayoutMultiplier(firstSymbol, matchCount, paytable);

  if (multiplier === 0) {
    return null;
  }

  const payout = betPerLine * multiplier;

  return {
    symbol: firstSymbol,
    matchCount,
    payout,
  };
}

/**
 * Get payout multiplier for a symbol and match count
 *
 * @param symbol - Symbol that matched
 * @param matchCount - Number of consecutive matches (3, 4, or 5)
 * @param paytable - Payout configuration
 * @returns Multiplier (0 if no payout)
 */
export function getPayoutMultiplier(
  symbol: SymbolId,
  matchCount: number,
  paytable: PaytableConfig
): number {
  const symbolConfig = paytable.symbols.find((s) => s.symbol === symbol);

  if (!symbolConfig) {
    return 0;
  }

  switch (matchCount) {
    case 3:
      return symbolConfig.match3;
    case 4:
      return symbolConfig.match4;
    case 5:
      return symbolConfig.match5;
    default:
      return 0;
  }
}

/**
 * Calculate total payout across all winning lines
 *
 * @param winningLines - Array of winning lines
 * @returns Total payout in microVOI
 */
export function calculateTotalPayout(winningLines: WinningLine[]): number {
  return winningLines.reduce((total, line) => total + line.payout, 0);
}

/**
 * Get symbols along a payline
 *
 * @param grid - 3x5 grid of symbols
 * @param pattern - Payline pattern
 * @returns Array of 5 symbols along the payline
 */
export function getPaylineSymbols(grid: SymbolId[][], pattern: PaylinePattern): SymbolId[] {
  const symbols: SymbolId[] = [];
  for (let reelIndex = 0; reelIndex < 5; reelIndex++) {
    const row = pattern[reelIndex];
    symbols.push(getSymbolAt(grid, reelIndex, row));
  }
  return symbols;
}

/**
 * Check if a payline has a specific pattern of symbols
 *
 * @param grid - 3x5 grid
 * @param pattern - Payline pattern
 * @param targetSymbols - Symbols to match (partial array, checks from left)
 * @returns True if payline matches target pattern
 */
export function paylineMatches(
  grid: SymbolId[][],
  pattern: PaylinePattern,
  targetSymbols: SymbolId[]
): boolean {
  const lineSymbols = getPaylineSymbols(grid, pattern);

  for (let i = 0; i < targetSymbols.length; i++) {
    if (lineSymbols[i] !== targetSymbols[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Default paytable from the 5reel contract
 */
export const DEFAULT_PAYTABLE: PaytableConfig = {
  symbols: [
    {
      symbol: 'A',
      displayName: 'Diamond',
      match3: 200,
      match4: 1000,
      match5: 10000,
    },
    {
      symbol: 'B',
      displayName: 'Gold',
      match3: 60,
      match4: 200,
      match5: 1000,
    },
    {
      symbol: 'C',
      displayName: 'Silver',
      match3: 30,
      match4: 100,
      match5: 500,
    },
    {
      symbol: 'D',
      displayName: 'Bronze',
      match3: 10,
      match4: 55,
      match5: 250,
    },
    {
      symbol: '_',
      displayName: 'Blank',
      match3: 0,
      match4: 0,
      match5: 0,
    },
  ],
  maxPayoutMultiplier: 10000,
};

/**
 * Default payline patterns (20 lines)
 */
export const DEFAULT_PAYLINE_PATTERNS: PaylinePattern[] = [
  [1, 1, 1, 1, 1], // 0: Middle line
  [0, 0, 0, 0, 0], // 1: Top line
  [2, 2, 2, 2, 2], // 2: Bottom line
  [0, 1, 2, 1, 0], // 3: V shape
  [2, 1, 0, 1, 2], // 4: Inverted V
  [1, 0, 0, 0, 1], // 5: Up then down
  [1, 2, 2, 2, 1], // 6: Down then up
  [0, 0, 1, 2, 2], // 7: Descending stairs
  [2, 2, 1, 0, 0], // 8: Ascending stairs
  [1, 2, 1, 0, 1], // 9: Zigzag down
  [1, 0, 1, 2, 1], // 10: Zigzag up
  [0, 1, 0, 1, 0], // 11: Wave top
  [2, 1, 2, 1, 2], // 12: Wave bottom
  [1, 0, 0, 1, 2], // 13: Diagonal rise
  [1, 2, 2, 1, 0], // 14: Diagonal fall
  [0, 0, 1, 0, 0], // 15: Peak
  [2, 2, 1, 2, 2], // 16: Valley
  [0, 1, 1, 1, 0], // 17: Plateau up
  [2, 1, 1, 1, 2], // 18: Plateau down
  [1, 1, 0, 1, 1], // 19: Peak middle
];
