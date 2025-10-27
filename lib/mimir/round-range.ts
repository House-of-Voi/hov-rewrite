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

    const firstRound = data[0]?.round;
    const lastRound = data[data.length - 1]?.round;

    if (typeof firstRound !== 'number' || typeof lastRound !== 'number') {
      console.error('Unexpected round values returned from block_header query');
      return {};
    }

    return {
      startRound: firstRound,
      endRound: lastRound,
    };
  } catch (error) {
    console.error('Error getting round range:', error);
    return {};
  }
}
