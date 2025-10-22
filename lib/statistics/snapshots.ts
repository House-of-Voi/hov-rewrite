import { createAdminClient } from '@/lib/db/supabaseAdmin';

type SnapshotType =
  | 'platform'
  | 'machine'
  | 'leaderboard'
  | 'leaderboard_address'
  | 'leaderboard_profile';

export interface PlatformSnapshotRecord {
  stats_data: Record<string, unknown>;
  date: string;
}

export interface LeaderboardSnapshotRecord {
  stats_data: Record<string, unknown>;
  hour: string;
}

/**
 * Fetch the most recent platform snapshot (daily) for the given machine.
 * Returns null if snapshots are unavailable or the table does not exist.
 */
export async function getLatestPlatformSnapshot(contractId?: string) {
  return queryDailySnapshot('platform', contractId);
}

/**
 * Fetch the most recent leaderboard snapshot (hourly) for the given mode/contract.
 * Returns null if snapshots are unavailable or the table does not exist.
 */
export async function getLatestLeaderboardSnapshot(
  mode: 'leaderboard_address' | 'leaderboard_profile',
  contractId?: string
) {
  return queryHourlySnapshot(mode, contractId);
}

async function queryDailySnapshot(
  snapshotType: SnapshotType,
  contractId?: string
): Promise<PlatformSnapshotRecord | null> {
  const supabase = createAdminClient();

  try {
    const query = supabase
      .from('stats_snapshots_daily')
      .select('stats_data, date')
      .eq('snapshot_type', snapshotType)
      .order('date', { ascending: false })
      .limit(1);

    if (contractId) {
      query.eq('slot_machine_config_id', contractId);
    }

    const { data } = await query.maybeSingle();

    return data as PlatformSnapshotRecord | null;
  } catch (error) {
    if (isMissingRelationError(error)) {
      console.warn(
        'Daily snapshot table is unavailable. Skipping snapshot lookup.'
      );
      return null;
    }

    console.error('Failed to query daily snapshot:', error);
    return null;
  }
}

async function queryHourlySnapshot(
  snapshotType: SnapshotType,
  contractId?: string
): Promise<LeaderboardSnapshotRecord | null> {
  const supabase = createAdminClient();

  try {
    const query = supabase
      .from('stats_snapshots_hourly')
      .select('stats_data, hour')
      .eq('snapshot_type', snapshotType)
      .order('hour', { ascending: false })
      .limit(1);

    if (contractId) {
      query.eq('slot_machine_config_id', contractId);
    }

    const { data } = await query.maybeSingle();

    return data as LeaderboardSnapshotRecord | null;
  } catch (error) {
    if (isMissingRelationError(error)) {
      console.warn(
        'Hourly snapshot table is unavailable. Skipping snapshot lookup.'
      );
      return null;
    }

    console.error('Failed to query hourly snapshot:', error);
    return null;
  }
}

function isMissingRelationError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const message =
    'message' in error && typeof (error as { message?: unknown }).message === 'string'
      ? (error as { message: string }).message
      : '';

  return (
    message.includes('relation "stats_snapshots_daily" does not exist') ||
    message.includes('relation "stats_snapshots_hourly" does not exist')
  );
}
