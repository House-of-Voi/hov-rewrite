/**
 * Provably Fair Utility
 *
 * Utilities for verifying the fairness of game outcomes using blockchain seeds.
 */

import type {
  SymbolId,
  ReelConfig,
  ProvablyFairData,
  SpinOutcome,
  PaylinePattern,
  PaytableConfig,
} from '../types';
import { generateReelTopsFromSeed, generateGrid } from './gridGenerator';
import { evaluatePaylines } from './paylineEvaluator';

/**
 * Verify a spin outcome is provably fair
 *
 * @param betKey - Bet key from contract
 * @param blockSeed - Block seed from blockchain
 * @param blockNumber - Block number where outcome was determined
 * @param outcome - Claimed outcome to verify
 * @param reelConfig - Reel configuration
 * @param paylinePatterns - Payline patterns
 * @param paytable - Paytable configuration
 * @param betPerLine - Bet per line
 * @returns Provably fair verification data
 */
export async function verifySpinOutcome(
  betKey: string,
  blockSeed: string,
  blockNumber: number,
  outcome: SpinOutcome,
  reelConfig: ReelConfig,
  paylinePatterns: PaylinePattern[],
  paytable: PaytableConfig,
  betPerLine: number
): Promise<ProvablyFairData> {
  const verificationSteps: { step: string; value: string }[] = [];

  // Step 1: Record inputs
  verificationSteps.push({
    step: 'Bet Key',
    value: betKey,
  });

  verificationSteps.push({
    step: 'Block Seed',
    value: blockSeed,
  });

  verificationSteps.push({
    step: 'Block Number',
    value: blockNumber.toString(),
  });

  // Step 2: Generate reel tops from seeds
  const reelTops = await generateReelTopsFromSeed(blockSeed, betKey);

  verificationSteps.push({
    step: 'Generated Reel Tops',
    value: reelTops.join(', '),
  });

  // Step 3: Generate grid from reel tops
  const grid = generateGrid(reelTops, reelConfig);

  verificationSteps.push({
    step: 'Generated Grid',
    value: JSON.stringify(grid),
  });

  // Step 4: Compare grids
  const gridsMatch = compareGrids(grid, outcome.grid);

  verificationSteps.push({
    step: 'Grids Match',
    value: gridsMatch ? 'Yes' : 'No',
  });

  // Step 5: Verify payouts
  const calculatedWinningLines = evaluatePaylines(grid, paylinePatterns, paytable, betPerLine);
  const calculatedPayout = calculatedWinningLines.reduce(
    (sum, line) => sum + line.payout,
    0
  );

  verificationSteps.push({
    step: 'Calculated Payout',
    value: `${calculatedPayout} microVOI`,
  });

  verificationSteps.push({
    step: 'Claimed Payout',
    value: `${outcome.totalPayout} microVOI`,
  });

  const payoutsMatch = calculatedPayout === outcome.totalPayout;

  verificationSteps.push({
    step: 'Payouts Match',
    value: payoutsMatch ? 'Yes' : 'No',
  });

  // Overall verification
  const verified = gridsMatch && payoutsMatch;

  return {
    betKey,
    blockSeed,
    blockNumber,
    reelTops,
    grid,
    verified,
    verificationSteps,
  };
}

/**
 * Compare two grids for equality
 */
function compareGrids(grid1: SymbolId[][], grid2: SymbolId[][]): boolean {
  if (grid1.length !== grid2.length) return false;

  for (let reel = 0; reel < grid1.length; reel++) {
    if (grid1[reel].length !== grid2[reel].length) return false;

    for (let row = 0; row < grid1[reel].length; row++) {
      if (grid1[reel][row] !== grid2[reel][row]) return false;
    }
  }

  return true;
}

/**
 * Generate a shareable verification link
 *
 * @param betKey - Bet key
 * @param blockNumber - Block number
 * @param contractId - Contract ID
 * @returns URL that can be used to verify the outcome
 */
export function generateVerificationLink(
  betKey: string,
  blockNumber: number,
  contractId: bigint
): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const params = new URLSearchParams({
    betKey,
    block: blockNumber.toString(),
    contract: contractId.toString(),
  });

  return `${baseUrl}/verify?${params.toString()}`;
}

/**
 * Format verification data for display
 */
export function formatVerificationData(data: ProvablyFairData): string {
  let output = 'PROVABLY FAIR VERIFICATION\n';
  output += '='.repeat(50) + '\n\n';

  output += `Bet Key: ${data.betKey}\n`;
  output += `Block Seed: ${data.blockSeed}\n`;
  output += `Block Number: ${data.blockNumber}\n`;
  output += `Verified: ${data.verified ? '✓ YES' : '✗ NO'}\n\n`;

  output += 'Reel Positions:\n';
  output += `  ${data.reelTops.join(', ')}\n\n`;

  output += 'Resulting Grid:\n';
  for (let row = 0; row < 3; row++) {
    output += '  ';
    for (let reel = 0; reel < 5; reel++) {
      output += data.grid[reel][row] + ' ';
    }
    output += '\n';
  }

  output += '\nVerification Steps:\n';
  data.verificationSteps.forEach((step, index) => {
    output += `  ${index + 1}. ${step.step}: ${step.value}\n`;
  });

  return output;
}

/**
 * Hash a value with SHA-256
 */
export async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify blockchain seed authenticity (requires blockchain RPC)
 *
 * @param blockNumber - Block number to verify
 * @param claimedSeed - Claimed seed value
 * @param rpcUrl - Blockchain RPC URL
 * @returns True if seed matches blockchain data
 */
export async function verifyBlockSeed(
  blockNumber: number,
  claimedSeed: string,
  rpcUrl: string
): Promise<boolean> {
  try {
    // Fetch block data from blockchain
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'getBlock',
        params: [blockNumber],
        id: 1,
      }),
    });

    const data = await response.json();

    if (!data.result || !data.result.seed) {
      return false;
    }

    // Compare seeds
    return data.result.seed === claimedSeed;
  } catch (error) {
    console.error('Failed to verify block seed:', error);
    return false;
  }
}

/**
 * Create a provably fair certificate for a spin
 *
 * @param data - Verification data
 * @returns HTML certificate string
 */
export function createFairnessCertificate(data: ProvablyFairData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Provably Fair Certificate</title>
  <style>
    body {
      font-family: monospace;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .certificate {
      background: white;
      border: 2px solid #333;
      padding: 30px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 30px;
      text-transform: uppercase;
    }
    .verified {
      color: green;
      font-size: 32px;
      text-align: center;
      margin: 20px 0;
    }
    .field {
      margin: 10px 0;
      padding: 5px;
      border-bottom: 1px solid #eee;
    }
    .label {
      font-weight: bold;
      display: inline-block;
      width: 150px;
    }
    .grid {
      margin: 20px 0;
      padding: 15px;
      background: #f9f9f9;
      border: 1px solid #ddd;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">Provably Fair Certificate</div>
    <div class="verified">${data.verified ? '✓ VERIFIED' : '✗ VERIFICATION FAILED'}</div>

    <div class="field">
      <span class="label">Bet Key:</span>
      <span>${data.betKey}</span>
    </div>

    <div class="field">
      <span class="label">Block Number:</span>
      <span>${data.blockNumber}</span>
    </div>

    <div class="field">
      <span class="label">Block Seed:</span>
      <span>${data.blockSeed}</span>
    </div>

    <div class="field">
      <span class="label">Reel Positions:</span>
      <span>${data.reelTops.join(', ')}</span>
    </div>

    <div class="grid">
      <strong>Resulting Grid:</strong><br/>
      <pre>${formatGridForCertificate(data.grid)}</pre>
    </div>

    <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
      This certificate proves that the game outcome was determined fairly using blockchain randomness.
      You can verify this independently by recomputing the grid from the bet key and block seed.
    </p>
  </div>
</body>
</html>
  `.trim();
}

function formatGridForCertificate(grid: SymbolId[][]): string {
  let output = '';
  for (let row = 0; row < 3; row++) {
    for (let reel = 0; reel < 5; reel++) {
      output += grid[reel][row] + '  ';
    }
    output += '\n';
  }
  return output;
}
