export const mockProfile = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  primary_email: 'demo@houseofvoi.com',
  display_name: 'Demo User',
  avatar_url: null,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
};

export const mockAccounts = [
  {
    id: '660e8400-e29b-41d4-a716-446655440001',
    profile_id: mockProfile.id,
    chain: 'base' as const,
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    wallet_provider: 'coinbase-embedded' as const,
    is_primary: true,
    created_at: '2024-01-15T10:05:00Z',
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440002',
    profile_id: mockProfile.id,
    chain: 'voi' as const,
    address: 'QLVXZQKF7ZZQXZQKF7ZZQXZQKF7ZZQXZQKF7ZZQXZQKF7ZZ',
    wallet_provider: 'extern' as const,
    is_primary: false,
    created_at: '2024-01-16T14:20:00Z',
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440003',
    profile_id: mockProfile.id,
    chain: 'solana' as const,
    address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    wallet_provider: 'extern' as const,
    is_primary: false,
    created_at: '2024-01-20T09:15:00Z',
  },
];

// One-to-one referrals: each code is for one specific person
export const mockReferrals = [
  {
    id: '770e8400-e29b-41d4-a716-446655440001',
    referrer_profile_id: mockProfile.id,
    referred_profile_id: 'ref-player1-uuid',
    referral_code: 'PLAYER1',
    prospect_fingerprint: 'fp_player1_abc',
    attributed_at: '2024-02-10T15:30:00Z',
    converted_at: '2024-02-12T10:20:00Z',
    created_at: '2024-01-15T11:00:00Z',
    deactivated_at: null,
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440002',
    referrer_profile_id: mockProfile.id,
    referred_profile_id: 'ref-player2-uuid',
    referral_code: 'PLAYER2',
    prospect_fingerprint: 'fp_player2_def',
    attributed_at: '2024-02-16T12:00:00Z',
    converted_at: '2024-02-18T14:30:00Z',
    created_at: '2024-02-01T08:30:00Z',
    deactivated_at: null,
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440003',
    referrer_profile_id: mockProfile.id,
    referred_profile_id: 'ref-player3-uuid',
    referral_code: 'PLAYER3',
    prospect_fingerprint: 'fp_player3_ghi',
    attributed_at: '2024-02-19T08:00:00Z',
    converted_at: '2024-02-20T09:15:00Z',
    created_at: '2024-02-05T14:20:00Z',
    deactivated_at: null,
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440004',
    referrer_profile_id: mockProfile.id,
    referred_profile_id: 'ref-player4-uuid',
    referral_code: 'PLAYER4',
    prospect_fingerprint: 'fp_player4_jkl',
    attributed_at: '2024-02-24T14:00:00Z',
    converted_at: '2024-02-25T16:45:00Z',
    created_at: '2024-02-10T10:00:00Z',
    deactivated_at: null,
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440005',
    referrer_profile_id: mockProfile.id,
    referred_profile_id: 'ref-player5-uuid',
    referral_code: 'PLAYER5',
    prospect_fingerprint: 'fp_player5_mno',
    attributed_at: '2024-02-28T10:00:00Z',
    converted_at: '2024-03-01T11:20:00Z',
    created_at: '2024-02-15T09:00:00Z',
    deactivated_at: null,
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440006',
    referrer_profile_id: mockProfile.id,
    referred_profile_id: 'ref-cryptofan-uuid',
    referral_code: 'CRYPTO1',
    prospect_fingerprint: 'fp_crypto_pqr',
    attributed_at: '2024-02-27T16:00:00Z',
    converted_at: '2024-02-28T08:30:00Z',
    created_at: '2024-02-20T11:00:00Z',
    deactivated_at: null,
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440007',
    referrer_profile_id: mockProfile.id,
    referred_profile_id: 'ref-luckyplayer-uuid',
    referral_code: 'LUCKY01',
    prospect_fingerprint: 'fp_lucky_stu',
    attributed_at: '2024-03-04T18:00:00Z',
    converted_at: '2024-03-05T19:10:00Z',
    created_at: '2024-02-25T13:00:00Z',
    deactivated_at: null,
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440008',
    referrer_profile_id: mockProfile.id,
    referred_profile_id: 'ref-voiwhale-uuid',
    referral_code: 'WHALE99',
    prospect_fingerprint: 'fp_whale_vwx',
    attributed_at: '2024-03-07T12:00:00Z',
    converted_at: '2024-03-08T13:25:00Z',
    created_at: '2024-03-01T10:00:00Z',
    deactivated_at: null,
  },
  // Pending referrals (created codes not yet used)
  {
    id: '770e8400-e29b-41d4-a716-446655440009',
    referrer_profile_id: mockProfile.id,
    referred_profile_id: null,
    referral_code: 'FRIEND1',
    prospect_fingerprint: 'fp_pending1_xyz',
    attributed_at: '2024-03-10T10:00:00Z',
    converted_at: null,
    created_at: '2024-03-05T15:00:00Z',
    deactivated_at: null,
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440010',
    referrer_profile_id: mockProfile.id,
    referred_profile_id: null,
    referral_code: 'FRIEND2',
    prospect_fingerprint: null,
    attributed_at: null,
    converted_at: null,
    created_at: '2024-03-08T12:00:00Z',
    deactivated_at: null,
  },
];

export const mockSessions = [
  {
    id: '990e8400-e29b-41d4-a716-446655440001',
    profile_id: mockProfile.id,
    jwt_id: 'jwt_demo_session_001',
    ip: '192.168.1.100',
    user_agent: 'Mozilla/5.0 (Demo Mode)',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockActivity = [
  {
    type: 'referral_created',
    message: 'Created referral code INVITE99',
    timestamp: '2024-02-01T08:30:00Z',
  },
  {
    type: 'account_linked',
    message: 'Linked Solana wallet',
    timestamp: '2024-01-20T09:15:00Z',
  },
  {
    type: 'account_linked',
    message: 'Linked Voi wallet',
    timestamp: '2024-01-16T14:20:00Z',
  },
  {
    type: 'referral_created',
    message: 'Created referral code DEMO123',
    timestamp: '2024-01-15T11:00:00Z',
  },
  {
    type: 'account_linked',
    message: 'Linked Base wallet',
    timestamp: '2024-01-15T10:05:00Z',
  },
  {
    type: 'profile_created',
    message: 'Account created',
    timestamp: '2024-01-15T10:00:00Z',
  },
];

export const mockStats = {
  totalReferrals: mockReferrals.length,
  totalAttributions: mockReferrals.filter(r => r.attributed_at !== null).length,
  convertedReferrals: mockReferrals.filter(r => r.referred_profile_id !== null).length,
  linkedAccounts: mockAccounts.length,
  totalEarnings: 0, // Placeholder for future rewards system
};

// Mock user referral progress - VOLUME BASED (0.5% of wagers)
export const mockReferralProgress = {
  totalConverted: 8, // Total converted referrals (with referred_profile_id)
  availableCredits: 3.28, // Available free gameplay credits
  lifetimeEarned: 4.53, // Total credits earned from referrals (all time) - 0.5% of 905.60
  lifetimeSpent: 1.25, // Credits spent on games
  totalVolume: 905.60, // Total volume wagered by all referrals
  pendingAttributions: 2, // Referrals that clicked link but haven't signed up yet
};

// Mock referral details - ONE-TO-ONE mapping to individual users
export const mockReferralDetails: Record<string, {
  username: string;
  profile_id: string;
  joined_at: string;
  first_game: string;
  totalWagered: number;
  gamesPlayed: number;
  creditsEarned: number;
  lastPlayedAt: string;
}> = {
  'PLAYER1': {
    username: 'Player1',
    profile_id: 'ref-player1-uuid',
    joined_at: '2024-02-12T10:20:00Z',
    first_game: 'Slots',
    totalWagered: 125.50,
    gamesPlayed: 45,
    creditsEarned: 0.63, // 0.5% of 125.50
    lastPlayedAt: '2024-03-10T15:30:00Z'
  },
  'PLAYER2': {
    username: 'Player2',
    profile_id: 'ref-player2-uuid',
    joined_at: '2024-02-18T14:30:00Z',
    first_game: 'Dice',
    totalWagered: 89.00,
    gamesPlayed: 32,
    creditsEarned: 0.45, // 0.5% of 89.00
    lastPlayedAt: '2024-03-12T09:15:00Z'
  },
  'PLAYER3': {
    username: 'Player3',
    profile_id: 'ref-player3-uuid',
    joined_at: '2024-02-20T09:15:00Z',
    first_game: 'Slots',
    totalWagered: 234.00,
    gamesPlayed: 67,
    creditsEarned: 1.17, // 0.5% of 234.00
    lastPlayedAt: '2024-03-14T18:45:00Z'
  },
  'PLAYER4': {
    username: 'Player4',
    profile_id: 'ref-player4-uuid',
    joined_at: '2024-02-25T16:45:00Z',
    first_game: 'Blackjack',
    totalWagered: 67.80,
    gamesPlayed: 28,
    creditsEarned: 0.34, // 0.5% of 67.80
    lastPlayedAt: '2024-03-13T11:20:00Z'
  },
  'PLAYER5': {
    username: 'Player5',
    profile_id: 'ref-player5-uuid',
    joined_at: '2024-03-01T11:20:00Z',
    first_game: 'Slots',
    totalWagered: 156.30,
    gamesPlayed: 52,
    creditsEarned: 0.78, // 0.5% of 156.30
    lastPlayedAt: '2024-03-14T21:10:00Z'
  },
  'CRYPTO1': {
    username: 'CryptoFan',
    profile_id: 'ref-cryptofan-uuid',
    joined_at: '2024-02-28T08:30:00Z',
    first_game: 'Dice',
    totalWagered: 78.00,
    gamesPlayed: 23,
    creditsEarned: 0.39, // 0.5% of 78.00
    lastPlayedAt: '2024-03-11T14:25:00Z'
  },
  'LUCKY01': {
    username: 'LuckyPlayer',
    profile_id: 'ref-luckyplayer-uuid',
    joined_at: '2024-03-05T19:10:00Z',
    first_game: 'Slots',
    totalWagered: 45.00,
    gamesPlayed: 18,
    creditsEarned: 0.23, // 0.5% of 45.00
    lastPlayedAt: '2024-03-10T16:40:00Z'
  },
  'WHALE99': {
    username: 'VoiWhale',
    profile_id: 'ref-voiwhale-uuid',
    joined_at: '2024-03-08T13:25:00Z',
    first_game: 'Blackjack',
    totalWagered: 110.00,
    gamesPlayed: 41,
    creditsEarned: 0.55, // 0.5% of 110.00
    lastPlayedAt: '2024-03-14T20:15:00Z'
  },
};
