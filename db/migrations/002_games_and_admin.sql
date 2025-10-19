-- HOUSE OF VOI – GAMES & ADMIN SCHEMA EXTENSION
-- This migration adds game tracking and administrative capabilities

-- Game types enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'game_type') THEN
    CREATE TYPE game_type AS ENUM ('slots', 'dice', 'cards');
  END IF;
END $$;

-- Admin role enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_role') THEN
    CREATE TYPE admin_role AS ENUM ('owner', 'operator', 'viewer');
  END IF;
END $$;

-- Games configuration table
CREATE TABLE IF NOT EXISTS public.games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type game_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}', -- Game-specific config (RTP, max bet, etc.)
  house_edge DECIMAL(5,4) NOT NULL DEFAULT 0.02, -- 2% house edge
  min_bet DECIMAL NOT NULL DEFAULT 0.001,
  max_bet DECIMAL NOT NULL DEFAULT 100,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Game rounds/sessions (player history)
CREATE TABLE IF NOT EXISTS public.game_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE RESTRICT,
  chain chain_type NOT NULL,
  bet_amount DECIMAL NOT NULL,
  result JSONB NOT NULL, -- Game-specific result data
  payout DECIMAL NOT NULL DEFAULT 0,
  profit DECIMAL GENERATED ALWAYS AS (payout - bet_amount) STORED,
  tx_hash TEXT, -- Blockchain transaction hash
  seed TEXT, -- Provably fair seed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin roles and permissions
CREATE TABLE IF NOT EXISTS public.admin_roles (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  role admin_role NOT NULL DEFAULT 'viewer',
  permissions JSONB DEFAULT '{}',
  granted_by uuid REFERENCES public.profiles(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- House treasury balances (per chain)
CREATE TABLE IF NOT EXISTS public.treasury_balances (
  chain chain_type PRIMARY KEY,
  balance DECIMAL NOT NULL DEFAULT 0,
  reserved DECIMAL NOT NULL DEFAULT 0, -- Amount reserved for pending payouts
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Daily statistics snapshots
CREATE TABLE IF NOT EXISTS public.daily_stats (
  date DATE PRIMARY KEY,
  chain chain_type,
  total_wagered DECIMAL NOT NULL DEFAULT 0,
  total_payout DECIMAL NOT NULL DEFAULT 0,
  house_profit DECIMAL GENERATED ALWAYS AS (total_wagered - total_payout) STORED,
  active_users INT NOT NULL DEFAULT 0,
  total_rounds INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_rounds_profile ON public.game_rounds(profile_id);
CREATE INDEX IF NOT EXISTS idx_game_rounds_game ON public.game_rounds(game_id);
CREATE INDEX IF NOT EXISTS idx_game_rounds_created ON public.game_rounds(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_rounds_chain ON public.game_rounds(chain);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON public.daily_stats(date DESC);

-- Updated at trigger for games
DROP TRIGGER IF EXISTS trg_games_updated_at ON public.games;
CREATE TRIGGER trg_games_updated_at
BEFORE UPDATE ON public.games
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS Policies

-- Games: Publicly readable, admin-only write
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_games_public_read ON public.games;
CREATE POLICY p_games_public_read
ON public.games
FOR SELECT USING (active = true);

DROP POLICY IF EXISTS p_games_admin_all ON public.games;
CREATE POLICY p_games_admin_all
ON public.games
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE profile_id = auth_profile_id()
    AND role IN ('owner', 'operator')
  )
);

-- Game rounds: Users see own, admins see all
ALTER TABLE public.game_rounds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_game_rounds_owner ON public.game_rounds;
CREATE POLICY p_game_rounds_owner
ON public.game_rounds
FOR SELECT USING (profile_id = auth_profile_id());

DROP POLICY IF EXISTS p_game_rounds_insert ON public.game_rounds;
CREATE POLICY p_game_rounds_insert
ON public.game_rounds
FOR INSERT WITH CHECK (profile_id = auth_profile_id());

DROP POLICY IF EXISTS p_game_rounds_admin_read ON public.game_rounds;
CREATE POLICY p_game_rounds_admin_read
ON public.game_rounds
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE profile_id = auth_profile_id()
  )
);

-- Admin roles: Admin-only
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_admin_roles_read ON public.admin_roles;
CREATE POLICY p_admin_roles_read
ON public.admin_roles
FOR SELECT USING (
  profile_id = auth_profile_id()
  OR EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE profile_id = auth_profile_id()
    AND role = 'owner'
  )
);

DROP POLICY IF EXISTS p_admin_roles_owner_manage ON public.admin_roles;
CREATE POLICY p_admin_roles_owner_manage
ON public.admin_roles
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE profile_id = auth_profile_id()
    AND role = 'owner'
  )
);

-- Treasury: Admin read-only
ALTER TABLE public.treasury_balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_treasury_admin_read ON public.treasury_balances;
CREATE POLICY p_treasury_admin_read
ON public.treasury_balances
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE profile_id = auth_profile_id()
  )
);

-- Daily stats: Admin read-only
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_daily_stats_admin_read ON public.daily_stats;
CREATE POLICY p_daily_stats_admin_read
ON public.daily_stats
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE profile_id = auth_profile_id()
  )
);

-- Insert some default games
INSERT INTO public.games (game_type, name, description, house_edge, min_bet, max_bet, config) VALUES
  ('slots', '5-Reel Slots', 'Classic 5-reel slot machine with massive jackpots', 0.02, 0.01, 100, '{"reels": 5, "symbols": 10, "paylines": 20}'),
  ('dice', 'Dice Roll', 'Predict the dice roll outcome', 0.015, 0.001, 50, '{"sides": 6, "multiplier": 5.5}'),
  ('cards', 'Blackjack', 'Classic 21 card game', 0.01, 0.01, 200, '{"decks": 6, "blackjack_payout": 1.5}')
ON CONFLICT DO NOTHING;

-- Initialize treasury balances for each chain
INSERT INTO public.treasury_balances (chain, balance) VALUES
  ('base', 0),
  ('voi', 0),
  ('solana', 0)
ON CONFLICT DO NOTHING;
