export const CacheTTL = {
  PLAYER_STATS: 120,
  PLATFORM_STATS: 180,
  LEADERBOARD: 300,
  PROFILE_AGGREGATE: 180,
  PROFILE_BREAKDOWN: 120,
  PLAYER_SPINS: 90,
  SNAPSHOT_DAILY: 86_400,
} as const;

export type CacheTtlValue = (typeof CacheTTL)[keyof typeof CacheTTL];
