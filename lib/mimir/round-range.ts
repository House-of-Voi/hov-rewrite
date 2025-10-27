import { mimirClient } from '@/lib/mimir/client';

export async function getRoundRangeForDateRange(
  startDate: Date,
  endDate: Date
): Promise<{ startRound?: number; endRound?: number }> {
  try {
    const { data, error } = await mimirClient
      .from('block_header')
      .select('round')
      .gte('realtime', startDate.toISOString())
      .lte('realtime', endDate.toISOString())
      .order('round', { ascending: true });

    if (error) {
      console.error('Failed to query block_header for round range:', error);
      return {};
    }

    if (!data || data.length === 0) {
      return {};
    }

    const rounds = data.map((row) => row.round as number);
    return {
      startRound: Math.min(...rounds),
      endRound: Math.max(...rounds),
    };
  } catch (error) {
    console.error('Error getting round range:', error);
    return {};
  }
}

