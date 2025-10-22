/**
 * Voi Wallet Balance Utilities
 *
 * Fetches balances for whitelisted assets from Mimir API and Algod
 */

// Whitelisted asset contract IDs
export const AUSDC_CONTRACT_ID = 302190;
export const UNIT_CONTRACT_ID = 420069;

// Mimir API endpoint
const MIMIR_API_BASE = 'https://voi-mainnet-mimirapi.nftnavigator.xyz';

// Algod endpoint for native VOI balance
const ALGOD_API_BASE = 'https://mainnet-api.voi.nodely.dev';

export interface AssetBalance {
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  usdValue: string;
  contractId?: number; // undefined for native VOI
  imageUrl?: string;
}

export interface MimirAssetBalance {
  name: string;
  symbol: string;
  balance: string;
  decimals: number;
  imageUrl?: string;
  usdValue: string;
  verified: number;
  accountId: string;
  assetType: string;
  contractId: number;
}

export interface MimirResponse {
  balances: MimirAssetBalance[];
}

export interface AlgodAccountInfo {
  amount: number; // in microVOI
  [key: string]: unknown;
}

/**
 * Fetch ARC-200 token balances from Mimir API
 */
export async function fetchMimirBalances(address: string): Promise<AssetBalance[]> {
  try {
    const response = await fetch(
      `${MIMIR_API_BASE}/account/assets?accountId=${address}`,
      { cache: 'no-store' } // Disable Next.js caching for fresh data
    );

    if (!response.ok) {
      throw new Error(`Mimir API error: ${response.status}`);
    }

    const data: MimirResponse = await response.json();

    // Filter and map whitelisted assets
    const whitelistedContracts = [AUSDC_CONTRACT_ID, UNIT_CONTRACT_ID];

    return data.balances
      .filter(asset => whitelistedContracts.includes(asset.contractId))
      .map(asset => ({
        symbol: asset.symbol,
        name: asset.name,
        balance: asset.balance,
        decimals: asset.decimals,
        usdValue: asset.usdValue,
        contractId: asset.contractId,
        imageUrl: asset.imageUrl,
      }));
  } catch (error) {
    console.error('Failed to fetch Mimir balances:', error);
    return [];
  }
}

/**
 * Fetch native VOI balance from Algod
 */
export async function fetchVoiBalance(address: string): Promise<AssetBalance | null> {
  try {
    const response = await fetch(
      `${ALGOD_API_BASE}/v2/accounts/${address}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      throw new Error(`Algod API error: ${response.status}`);
    }

    const data: AlgodAccountInfo = await response.json();

    // Native VOI has 6 decimals (microVOI)
    return {
      symbol: 'VOI',
      name: 'Voi',
      balance: data.amount.toString(),
      decimals: 6,
      usdValue: '0', // No USD pricing available for native VOI from algod
      contractId: undefined,
    };
  } catch (error) {
    console.error('Failed to fetch VOI balance:', error);
    return null;
  }
}

export interface WalletBalances {
  usdc: AssetBalance | null;
  otherTokens: AssetBalance[];
}

/**
 * Fetch all whitelisted balances for an address
 * Returns USDC separately as primary currency, with other tokens in array
 */
export async function fetchAllBalances(address: string): Promise<WalletBalances> {
  const [mimirBalances, voiBalance] = await Promise.all([
    fetchMimirBalances(address),
    fetchVoiBalance(address),
  ]);

  // Get USDC (aUSDC renamed)
  const ausdc = mimirBalances.find(b => b.contractId === AUSDC_CONTRACT_ID);
  const usdc = ausdc ? {
    ...ausdc,
    symbol: 'USDC',
    name: 'USDC',
  } : null;

  // Create ordered list of other tokens: VOI, UNIT
  const otherTokens: AssetBalance[] = [];

  // Add VOI
  if (voiBalance) otherTokens.push(voiBalance);

  // Add UNIT
  const unit = mimirBalances.find(b => b.contractId === UNIT_CONTRACT_ID);
  if (unit) otherTokens.push(unit);

  return {
    usdc,
    otherTokens,
  };
}

/**
 * Format balance with decimals
 */
export function formatBalance(balance: string, decimals: number): string {
  const num = BigInt(balance);
  const divisor = BigInt(10 ** decimals);

  const wholePart = num / divisor;
  const fractionalPart = num % divisor;

  // Convert fractional part to string with leading zeros
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');

  // Trim trailing zeros but keep at least 2 decimal places
  let trimmed = fractionalStr.replace(/0+$/, '');
  if (trimmed.length < 2) {
    trimmed = fractionalStr.substring(0, 2);
  }

  return `${wholePart}.${trimmed}`;
}

/**
 * Format USD value
 */
export function formatUsdValue(usdValue: string): string {
  const num = parseFloat(usdValue);

  if (num === 0) return '$0.00';
  if (num < 0.01) return '<$0.01';

  return `$${num.toFixed(2)}`;
}
