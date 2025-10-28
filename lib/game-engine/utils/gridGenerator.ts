/**
 * Grid Generator Utility
 *
 * Generates the 3x5 visible grid from reel positions.
 * Ported from the slot machine contract logic.
 */

import type { SymbolId, ReelConfig } from '../types';

/**
 * Generate a 3x5 grid from reel top positions
 *
 * @param reelTops - Array of 5 positions (0-99) indicating where each reel stops
 * @param reelConfig - Reel configuration containing symbol data
 * @returns 3x5 grid of symbols (5 reels x 3 visible symbols each)
 */
export function generateGrid(reelTops: number[], reelConfig: ReelConfig): SymbolId[][] {
  if (reelTops.length !== 5) {
    throw new Error('Expected exactly 5 reel positions');
  }

  const grid: SymbolId[][] = [];

  for (let reelIndex = 0; reelIndex < 5; reelIndex++) {
    const reelTop = reelTops[reelIndex];
    const reel = reelConfig.reels[reelIndex];

    // Get 3 consecutive symbols starting from reelTop
    const reelWindow = getReelWindow(reel, reelTop, 3);
    grid.push(reelWindow);
  }

  return grid;
}

/**
 * Get a window of symbols from a reel with wrapping
 *
 * @param reel - Array of symbols (length 100)
 * @param startPosition - Starting position (0-99)
 * @param windowSize - Number of symbols to get (typically 3)
 * @returns Array of symbols
 */
export function getReelWindow(
  reel: SymbolId[],
  startPosition: number,
  windowSize: number
): SymbolId[] {
  const reelLength = reel.length;
  const window: SymbolId[] = [];

  for (let i = 0; i < windowSize; i++) {
    const position = (startPosition + i) % reelLength;
    window.push(reel[position]);
  }

  return window;
}

/**
 * Generate reel tops from a seed (for provably fair verification)
 *
 * This replicates the contract's RNG logic:
 * 1. Concatenate block_seed + bet_key
 * 2. Hash with SHA256
 * 3. Use mod 100 for each reel position
 *
 * @param blockSeed - Block seed from blockchain (hex string)
 * @param betKey - Bet key (hex string)
 * @returns Array of 5 reel top positions (0-99)
 */
export async function generateReelTopsFromSeed(
  blockSeed: string,
  betKey: string
): Promise<number[]> {
  // Remove '0x' prefix if present
  const cleanBlockSeed = blockSeed.startsWith('0x') ? blockSeed.slice(2) : blockSeed;
  const cleanBetKey = betKey.startsWith('0x') ? betKey.slice(2) : betKey;

  // Concatenate seeds
  const combinedSeed = cleanBlockSeed + cleanBetKey;

  // Convert hex string to Uint8Array
  const seedBytes = hexToBytes(combinedSeed);

  // Hash with SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', seedBytes as BufferSource);
  const hashArray = new Uint8Array(hashBuffer);

  // Generate 5 reel tops using modulo
  const reelTops: number[] = [];
  for (let i = 0; i < 5; i++) {
    // Use different byte offsets for each reel
    // Contract uses: hash[i*4 : i*4+4] as a 32-bit number
    const offset = i * 4;
    const value =
      (hashArray[offset] << 24) |
      (hashArray[offset + 1] << 16) |
      (hashArray[offset + 2] << 8) |
      hashArray[offset + 3];

    // Mod 100 to get position 0-99
    reelTops.push(Math.abs(value) % 100);
  }

  return reelTops;
}

/**
 * Convert hex string to byte array
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Convert byte array to hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Get symbol at specific grid position
 *
 * @param grid - 3x5 grid (5 reels x 3 symbols)
 * @param reelIndex - Reel index (0-4)
 * @param row - Row index (0-2)
 * @returns Symbol at that position
 */
export function getSymbolAt(grid: SymbolId[][], reelIndex: number, row: number): SymbolId {
  if (reelIndex < 0 || reelIndex >= 5) {
    throw new Error(`Invalid reel index: ${reelIndex}`);
  }
  if (row < 0 || row >= 3) {
    throw new Error(`Invalid row: ${row}`);
  }

  return grid[reelIndex][row];
}

/**
 * Format grid as string for debugging
 */
export function formatGrid(grid: SymbolId[][]): string {
  const rows = ['', '', ''];

  for (let row = 0; row < 3; row++) {
    for (let reel = 0; reel < 5; reel++) {
      rows[row] += grid[reel][row] + ' ';
    }
  }

  return rows.join('\n');
}
