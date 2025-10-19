const normalizeAddress = (address: string) => address.trim().toLowerCase();

const contractSegment = (contractId?: string | number) =>
  contractId !== undefined ? String(contractId) : 'all';

export const CacheKeys = {
  playerStats: (address: string, contractId?: string | number) =>
    `mimir:player:${normalizeAddress(address)}:${contractSegment(contractId)}`,
  aggregatedProfile: (profileId: string, contractId?: string | number) =>
    `mimir:profile:${profileId}:${contractSegment(contractId)}`,
  profileBreakdown: (profileId: string, contractId?: string | number) =>
    `mimir:profile-breakdown:${profileId}:${contractSegment(contractId)}`,
  platformStats: (
    contractId?: string | number,
    timeframe?: 'daily' | 'all-time',
    date?: string
  ) =>
    [
      'mimir',
      'platform',
      contractSegment(contractId),
      timeframe || 'all-time',
      date || 'no-date',
    ].join(':'),
  leaderboard: (
    timeframe: 'daily' | 'all-time',
    rankBy: 'won' | 'profit' | 'rtp' | 'volume',
    limit: number,
    scope?: string | number,
    date?: string
  ) =>
    [
      'mimir',
      'leaderboard',
      timeframe,
      rankBy,
      limit,
      contractSegment(scope),
      date || 'no-date',
    ].join(':'),
  playerSpins: (
    address: string,
    limit: number,
    offset: number,
    order: 'asc' | 'desc',
    contractId?: string | number
  ) =>
    [
      'mimir',
      'spins',
      normalizeAddress(address),
      contractSegment(contractId),
      limit,
      offset,
      order,
    ].join(':'),
};
