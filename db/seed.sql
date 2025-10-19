-- HOUSE OF VOI – SEED DATA
-- Minimal essential data to get started

-- ============================================================================
-- GAMES (Essential game configurations)
-- ============================================================================

INSERT INTO public.games (game_type, name, description, house_edge, min_bet, max_bet, config) VALUES
  (
    'slots',
    '5-Reel Slots',
    'Classic 5-reel slot machine with massive jackpots and exciting bonus rounds',
    0.020,  -- 2% house edge
    0.01,   -- min bet
    100,    -- max bet
    '{
      "reels": 5,
      "rows": 3,
      "paylines": 20,
      "symbols": ["cherry", "lemon", "orange", "plum", "bell", "bar", "seven", "diamond", "wild", "scatter"],
      "rtp": 0.96,
      "maxWinMultiplier": 1000,
      "features": ["wilds", "scatters", "free_spins"]
    }'::jsonb
  ),
  (
    'keno',
    'Keno',
    'Pick your lucky numbers and watch them drop - classic lottery-style gameplay',
    0.025,  -- 2.5% house edge
    0.001,  -- min bet
    50,     -- max bet
    '{
      "numbersDrawn": 20,
      "totalNumbers": 80,
      "minPick": 1,
      "maxPick": 10,
      "rtp": 0.95,
      "payoutTable": {
        "1": [0, 3],
        "2": [0, 2, 15],
        "3": [0, 1, 5, 50],
        "4": [0, 0.5, 2, 10, 100],
        "5": [0, 0.5, 1, 5, 20, 200],
        "6": [0, 0.5, 1, 3, 10, 50, 500],
        "7": [0, 0, 0.5, 2, 5, 20, 100, 1000],
        "8": [0, 0, 0.5, 1, 3, 10, 50, 200, 2000],
        "9": [0, 0, 0, 0.5, 2, 5, 20, 100, 500, 5000],
        "10": [0, 0, 0, 0, 1, 3, 10, 50, 200, 1000, 10000]
      }
    }'::jsonb
  ),
  (
    'roulette',
    'European Roulette',
    'Spin the wheel and bet on your favorite numbers - European style with single zero',
    0.027,  -- 2.7% house edge (European roulette)
    0.01,   -- min bet
    200,    -- max bet
    '{
      "type": "european",
      "numbers": 37,
      "zeroCount": 1,
      "rtp": 0.973,
      "betTypes": {
        "straight": {"payout": 35, "description": "Single number"},
        "split": {"payout": 17, "description": "Two adjacent numbers"},
        "street": {"payout": 11, "description": "Three numbers in a row"},
        "corner": {"payout": 8, "description": "Four numbers forming a square"},
        "line": {"payout": 5, "description": "Six numbers (two rows)"},
        "dozen": {"payout": 2, "description": "12 numbers (1-12, 13-24, 25-36)"},
        "column": {"payout": 2, "description": "12 numbers in a column"},
        "red": {"payout": 1, "description": "All red numbers"},
        "black": {"payout": 1, "description": "All black numbers"},
        "even": {"payout": 1, "description": "All even numbers"},
        "odd": {"payout": 1, "description": "All odd numbers"},
        "low": {"payout": 1, "description": "1-18"},
        "high": {"payout": 1, "description": "19-36"}
      },
      "layout": {
        "red": [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36],
        "black": [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35]
      }
    }'::jsonb
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TREASURY BALANCES (Initialize for all chains)
-- ============================================================================

INSERT INTO public.treasury_balances (chain, balance, reserved) VALUES
  ('base', 0, 0),
  ('voi', 0, 0),
  ('solana', 0, 0)
ON CONFLICT (chain) DO NOTHING;

-- ============================================================================
-- OPTIONAL: Create an admin user (uncomment and update with your profile ID)
-- ============================================================================

-- To create an admin user:
-- 1. Sign up normally through your app to create a profile
-- 2. Find your profile ID from the profiles table
-- 3. Uncomment the INSERT below and replace 'YOUR-PROFILE-UUID-HERE' with your actual profile ID
-- 4. Run this INSERT manually in the Supabase SQL editor

-- INSERT INTO public.admin_roles (profile_id, role, granted_by, permissions) VALUES
--   ('YOUR-PROFILE-UUID-HERE', 'owner', NULL, '{
--     "can_manage_games": true,
--     "can_view_stats": true,
--     "can_manage_admins": true,
--     "can_view_treasury": true
--   }'::jsonb)
-- ON CONFLICT (profile_id) DO UPDATE
-- SET role = EXCLUDED.role,
--     permissions = EXCLUDED.permissions;
