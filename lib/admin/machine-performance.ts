import { createAdminClient } from '@/lib/db/supabaseAdmin';
import { getPlatformStats, getPlatformStatsByDate } from '@/lib/mimir/queries';
import { getRoundRangeForDateRange } from '@/lib/mimir/round-range';
import type { MimirPlatformStats } from '@/lib/types/database';

export type MachineConfigLite = {
  id: string;
  name: string;
  display_name: string | null;
  description: string | null;
  theme: string | null;
  contract_id: number;
  chain: 'base' | 'voi' | 'solana';
  is_active: boolean;
  house_edge: number;
  rtp_target: number;
  min_bet: number;
  max_bet: number;
  max_paylines: number;
  launched_at: string | null;
  created_at: string;
  updated_at: string;
};

export interface MachinePerformance {
  config: MachineConfigLite;
  allTime: MimirPlatformStats | null;
  statsByRange: Record<string, MimirPlatformStats | null>;
}

export interface MachinePerformanceResult {
  machines: MachinePerformance[];
  roundRanges: Map<string, { startRound?: number; endRound?: number }>;
}

export async function fetchMachinePerformance(
  rangeDefinitions: Record<string, { start: Date; end: Date }>
): Promise<MachinePerformanceResult> {
  const supabase = createAdminClient();

  const { data: configs, error } = await supabase
    .from('slot_machine_configs')
    .select(
      'id, name, display_name, description, theme, contract_id, chain, is_active, house_edge, rtp_target, min_bet, max_bet, max_paylines, launched_at, created_at, updated_at'
    )
    .eq('is_active', true)
    .order('display_name', { ascending: true });

  if (error) {
    throw new Error(`Failed to load slot machine configs: ${error.message}`);
  }

  const machines = (configs || [])
    .filter((config) => config.contract_id && Number(config.contract_id) > 0)
    .map((config) => ({
      id: config.id as string,
      name: config.name as string,
      display_name: (config.display_name as string) ?? null,
      description: (config.description as string) ?? null,
      theme: (config.theme as string) ?? null,
      contract_id: Number(config.contract_id),
      chain: (config.chain as MachineConfigLite['chain']) ?? 'voi',
      is_active: Boolean(config.is_active),
      house_edge: Number(config.house_edge) || 0,
      rtp_target: Number(config.rtp_target) || 0,
      min_bet: Number(config.min_bet) || 0,
      max_bet: Number(config.max_bet) || 0,
      max_paylines: Number(config.max_paylines) || 0,
      launched_at: (config.launched_at as string) ?? null,
      created_at: (config.created_at as string) ?? new Date().toISOString(),
      updated_at: (config.updated_at as string) ?? new Date().toISOString(),
    }));

  const rangeEntries = Object.entries(rangeDefinitions);
  const roundRanges = new Map<string, { startRound?: number; endRound?: number }>();

  await Promise.all(
    rangeEntries.map(async ([key, range]) => {
      const result = await getRoundRangeForDateRange(range.start, range.end);
      roundRanges.set(key, result);
    })
  );

  const performances: MachinePerformance[] = await Promise.all(
    machines.map(async (machine) => {
      const contractId = machine.contract_id;
      let allTimeStat: MachinePerformance['allTime'] = null;

      try {
        const allTime = await getPlatformStats(contractId);
        allTimeStat = allTime && allTime.length > 0 ? allTime[0] : null;
      } catch (error) {
        console.warn(`Failed to fetch all-time stats for contract ${contractId}:`, error);
      }

      const statsByRange: Record<string, MimirPlatformStats | null> = {};

      for (const [key, range] of roundRanges.entries()) {
        if (range.startRound !== undefined && range.endRound !== undefined) {
          try {
            statsByRange[key] = await getPlatformStatsByDate(contractId, range.startRound, range.endRound);
          } catch (error) {
            console.warn(`Failed to fetch stats for contract ${contractId} in range ${key}:`, error);
            statsByRange[key] = null;
          }
        } else {
          statsByRange[key] = null;
        }
      }

      return {
        config: machine,
        allTime: allTimeStat,
        statsByRange,
      };
    })
  );

  return { machines: performances, roundRanges };
}
