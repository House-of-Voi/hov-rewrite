/**
 * Treasury Aggregation Utilities
 * Helper functions to aggregate treasury data by chain, game type, and calculate totals
 */

import type { TreasuryItem, ChainTotal, GameTypeTotal, GrandTotal } from '@/lib/types/admin';

/**
 * Aggregate treasuries by chain
 */
export function aggregateByChain(treasuries: TreasuryItem[]): ChainTotal[] {
  const chainMap = new Map<string, ChainTotal>();

  for (const treasury of treasuries) {
    const existing = chainMap.get(treasury.chain);

    if (existing) {
      existing.total_balance = (
        parseFloat(existing.total_balance) + parseFloat(treasury.balance)
      ).toFixed(8);
      existing.total_reserved = (
        parseFloat(existing.total_reserved) + parseFloat(treasury.reserved)
      ).toFixed(8);
      existing.total_available = (
        parseFloat(existing.total_available) + parseFloat(treasury.available)
      ).toFixed(8);
      existing.machine_count++;
    } else {
      chainMap.set(treasury.chain, {
        chain: treasury.chain,
        total_balance: treasury.balance,
        total_reserved: treasury.reserved,
        total_available: treasury.available,
        machine_count: 1,
      });
    }
  }

  return Array.from(chainMap.values()).sort((a, b) => a.chain.localeCompare(b.chain));
}

/**
 * Aggregate treasuries by game type
 */
export function aggregateByGameType(treasuries: TreasuryItem[]): GameTypeTotal[] {
  const gameTypeMap = new Map<string, GameTypeTotal>();

  for (const treasury of treasuries) {
    const existing = gameTypeMap.get(treasury.game_type);

    if (existing) {
      existing.total_balance = (
        parseFloat(existing.total_balance) + parseFloat(treasury.balance)
      ).toFixed(8);
      existing.total_reserved = (
        parseFloat(existing.total_reserved) + parseFloat(treasury.reserved)
      ).toFixed(8);
      existing.total_available = (
        parseFloat(existing.total_available) + parseFloat(treasury.available)
      ).toFixed(8);
      existing.machine_count++;
    } else {
      gameTypeMap.set(treasury.game_type, {
        game_type: treasury.game_type,
        total_balance: treasury.balance,
        total_reserved: treasury.reserved,
        total_available: treasury.available,
        machine_count: 1,
      });
    }
  }

  return Array.from(gameTypeMap.values()).sort((a, b) => a.game_type.localeCompare(b.game_type));
}

/**
 * Calculate grand total across all treasuries
 */
export function calculateGrandTotal(treasuries: TreasuryItem[]): GrandTotal {
  const grand: GrandTotal = {
    total_balance: '0',
    total_reserved: '0',
    total_available: '0',
    total_machines: treasuries.length,
  };

  for (const treasury of treasuries) {
    grand.total_balance = (
      parseFloat(grand.total_balance) + parseFloat(treasury.balance)
    ).toFixed(8);
    grand.total_reserved = (
      parseFloat(grand.total_reserved) + parseFloat(treasury.reserved)
    ).toFixed(8);
    grand.total_available = (
      parseFloat(grand.total_available) + parseFloat(treasury.available)
    ).toFixed(8);
  }

  return grand;
}

/**
 * Format treasury items with calculated available balance
 */
export function formatTreasuryItems(rawTreasuries: any[]): TreasuryItem[] {
  return rawTreasuries.map(t => ({
    contract_id: t.contract_id,
    chain: t.chain,
    game_type: t.game_type,
    game_name: t.game_name,
    balance: t.balance,
    reserved: t.reserved,
    available: (parseFloat(t.balance) - parseFloat(t.reserved)).toFixed(8),
    updated_at: t.updated_at,
  }));
}
