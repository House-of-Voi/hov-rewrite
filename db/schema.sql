-- HOUSE OF VOI – CONSOLIDATED DATABASE SCHEMA
-- This schema includes all tables for authentication, referrals, games, and admin functionality

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chain_type') THEN
    CREATE TYPE chain_type AS ENUM ('base', 'voi', 'solana');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wallet_provider') THEN
    CREATE TYPE wallet_provider AS ENUM ('coinbase-embedded', 'extern');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'game_type') THEN
    CREATE TYPE game_type AS ENUM ('slots', 'keno', 'roulette');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credit_transaction_type') THEN
    CREATE TYPE credit_transaction_type AS ENUM ('earned', 'spent', 'expired', 'bonus');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_role') THEN
    CREATE TYPE admin_role AS ENUM ('owner', 'operator', 'viewer');
  END IF;
END $$;

-- ============================================================================
-- CORE TABLES (Authentication & User Management)
-- ============================================================================

-- User profiles (one per user, independent of blockchain accounts)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_email text NOT NULL UNIQUE,
  display_name text,
  avatar_url text,
  referral_code text UNIQUE,
  max_referrals int NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Blockchain accounts linked to profiles (multi-chain support)
CREATE TABLE IF NOT EXISTS public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  chain chain_type NOT NULL,
  address text NOT NULL,
  wallet_provider wallet_provider NOT NULL DEFAULT 'coinbase-embedded',
  is_primary boolean NOT NULL DEFAULT false,
  derived_from_chain chain_type,
  derived_from_address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(chain, address)
);

-- User sessions (for JWT tracking and revocation)
CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cdp_user_id text,
  cdp_access_token_hash text,
  jwt_id uuid,
  ip inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

-- Authentication nonces (for wallet signature verification)
CREATE TABLE IF NOT EXISTS public.nonces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text NOT NULL,
  chain chain_type NOT NULL,
  nonce text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (chain, address)
);

-- ============================================================================
-- GAME TABLES
-- ============================================================================

-- Game configurations (slots, keno, roulette)
CREATE TABLE IF NOT EXISTS public.games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type game_type NOT NULL,
  name text NOT NULL,
  description text,
  config jsonb NOT NULL DEFAULT '{}', -- Game-specific config (RTP, max bet, etc.)
  house_edge decimal(5,4) NOT NULL DEFAULT 0.02, -- 2% house edge
  min_bet decimal NOT NULL DEFAULT 0.001,
  max_bet decimal NOT NULL DEFAULT 100,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Individual game plays/rounds
CREATE TABLE IF NOT EXISTS public.game_plays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE RESTRICT,
  chain chain_type NOT NULL,
  bet_amount numeric(20, 8) NOT NULL,
  payout_amount numeric(20, 8) NOT NULL DEFAULT 0,
  profit_amount numeric(20, 8) GENERATED ALWAYS AS (payout_amount - bet_amount) STORED,
  tx_hash text, -- Blockchain transaction hash
  seed text, -- Provably fair seed
  result jsonb, -- Game-specific result data
  used_credits boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- REFERRAL SYSTEM TABLES
-- ============================================================================

-- Referral relationships (referred user links to their referrer)
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_profile_id uuid UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT false,
  activated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT no_self_referral CHECK (referrer_profile_id != referred_profile_id)
);

-- Referral credits earned from referred users' gameplay
CREATE TABLE IF NOT EXISTS public.referral_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_play_id uuid NOT NULL REFERENCES public.game_plays(id) ON DELETE CASCADE,
  wager_amount numeric(20, 8) NOT NULL,
  credit_earned numeric(20, 8) NOT NULL,
  credit_percentage numeric(5, 2) NOT NULL DEFAULT 0.50,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(game_play_id)
);

-- Credit transactions (ledger for all credit movements)
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  transaction_type credit_transaction_type NOT NULL,
  amount numeric(20, 8) NOT NULL,
  balance_after numeric(20, 8) NOT NULL,
  reference_id uuid,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- ADMIN TABLES
-- ============================================================================

-- Admin roles and permissions
CREATE TABLE IF NOT EXISTS public.admin_roles (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  role admin_role NOT NULL DEFAULT 'viewer',
  permissions jsonb DEFAULT '{}',
  granted_by uuid REFERENCES public.profiles(id),
  granted_at timestamptz NOT NULL DEFAULT now()
);

-- House treasury balances (per chain)
CREATE TABLE IF NOT EXISTS public.treasury_balances (
  chain chain_type PRIMARY KEY,
  balance decimal NOT NULL DEFAULT 0,
  reserved decimal NOT NULL DEFAULT 0, -- Amount reserved for pending payouts
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Daily statistics snapshots
CREATE TABLE IF NOT EXISTS public.daily_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  chain chain_type,
  total_wagered decimal NOT NULL DEFAULT 0,
  total_payout decimal NOT NULL DEFAULT 0,
  house_profit decimal GENERATED ALWAYS AS (total_wagered - total_payout) STORED,
  active_users int NOT NULL DEFAULT 0,
  total_rounds int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(date, chain)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Core tables
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_accounts_profile ON public.accounts(profile_id);
CREATE INDEX IF NOT EXISTS idx_sessions_profile ON public.sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_sessions_cdp_user ON public.sessions(cdp_user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON public.sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_nonces_expiry ON public.nonces(expires_at);

-- Referrals
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_profile_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals(referred_profile_id);
CREATE INDEX IF NOT EXISTS idx_referrals_is_active ON public.referrals(is_active);
CREATE INDEX IF NOT EXISTS idx_referral_credits_referrer ON public.referral_credits(referrer_profile_id);
CREATE INDEX IF NOT EXISTS idx_referral_credits_referred ON public.referral_credits(referred_profile_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_profile ON public.credit_transactions(profile_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created ON public.credit_transactions(created_at);

-- Games
CREATE INDEX IF NOT EXISTS idx_game_plays_profile ON public.game_plays(profile_id);
CREATE INDEX IF NOT EXISTS idx_game_plays_game ON public.game_plays(game_id);
CREATE INDEX IF NOT EXISTS idx_game_plays_created ON public.game_plays(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_plays_chain ON public.game_plays(chain);

-- Stats
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON public.daily_stats(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_stats_chain ON public.daily_stats(chain);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END $$;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_games_updated_at ON public.games;
CREATE TRIGGER trg_games_updated_at
BEFORE UPDATE ON public.games
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_treasury_updated_at ON public.treasury_balances;
CREATE TRIGGER trg_treasury_updated_at
BEFORE UPDATE ON public.treasury_balances
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- REFERRAL HELPER FUNCTIONS
-- ============================================================================

-- Count active referrals for a given profile
CREATE OR REPLACE FUNCTION count_active_referrals(p_profile_id uuid)
RETURNS int LANGUAGE sql STABLE AS $$
  SELECT COUNT(*)::int
  FROM public.referrals
  WHERE referrer_profile_id = p_profile_id
  AND is_active = true;
$$;

-- Check if a profile can accept new active referrals
CREATE OR REPLACE FUNCTION can_accept_referral(p_profile_id uuid)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT count_active_referrals(p_profile_id) < (
    SELECT max_referrals FROM public.profiles WHERE id = p_profile_id
  );
$$;

-- Activate pending referrals when slots become available
CREATE OR REPLACE FUNCTION activate_pending_referrals(p_profile_id uuid)
RETURNS int LANGUAGE plpgsql AS $$
DECLARE
  slots_available int;
  activated_count int := 0;
BEGIN
  -- Calculate how many slots are available
  SELECT max_referrals - count_active_referrals(p_profile_id)
  INTO slots_available
  FROM public.profiles
  WHERE id = p_profile_id;

  IF slots_available > 0 THEN
    -- Activate the oldest pending referrals up to the available slots
    WITH to_activate AS (
      SELECT id
      FROM public.referrals
      WHERE referrer_profile_id = p_profile_id
      AND is_active = false
      AND referred_profile_id IS NOT NULL
      ORDER BY created_at
      LIMIT slots_available
    )
    UPDATE public.referrals
    SET is_active = true, activated_at = now()
    WHERE id IN (SELECT id FROM to_activate);

    GET DIAGNOSTICS activated_count = ROW_COUNT;
  END IF;

  RETURN activated_count;
END $$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nonces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treasury_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

-- Helper function to get authenticated profile ID from JWT
CREATE OR REPLACE FUNCTION auth_profile_id()
RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::jsonb->>'sub','')::uuid
$$;

-- ============================================================================
-- RLS POLICIES: PROFILES
-- ============================================================================

DROP POLICY IF EXISTS p_profiles_owner_rw ON public.profiles;
CREATE POLICY p_profiles_owner_rw
ON public.profiles
FOR SELECT USING (id = auth_profile_id());

DROP POLICY IF EXISTS p_profiles_update_owner ON public.profiles;
CREATE POLICY p_profiles_update_owner
ON public.profiles
FOR UPDATE USING (id = auth_profile_id());

DROP POLICY IF EXISTS p_profiles_insert_server ON public.profiles;
CREATE POLICY p_profiles_insert_server
ON public.profiles
FOR INSERT
WITH CHECK (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');

-- ============================================================================
-- RLS POLICIES: ACCOUNTS
-- ============================================================================

DROP POLICY IF EXISTS p_accounts_owner_rw ON public.accounts;
CREATE POLICY p_accounts_owner_rw
ON public.accounts
FOR SELECT USING (profile_id = auth_profile_id());

DROP POLICY IF EXISTS p_accounts_update_owner ON public.accounts;
CREATE POLICY p_accounts_update_owner
ON public.accounts
FOR UPDATE USING (profile_id = auth_profile_id());

DROP POLICY IF EXISTS p_accounts_delete_owner ON public.accounts;
CREATE POLICY p_accounts_delete_owner
ON public.accounts
FOR DELETE USING (profile_id = auth_profile_id());

DROP POLICY IF EXISTS p_accounts_insert_server ON public.accounts;
CREATE POLICY p_accounts_insert_server
ON public.accounts
FOR INSERT
WITH CHECK (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');

-- ============================================================================
-- RLS POLICIES: SESSIONS
-- ============================================================================

DROP POLICY IF EXISTS p_sessions_owner_r ON public.sessions;
CREATE POLICY p_sessions_owner_r
ON public.sessions
FOR SELECT USING (profile_id = auth_profile_id());

DROP POLICY IF EXISTS p_sessions_write_server ON public.sessions;
CREATE POLICY p_sessions_write_server
ON public.sessions
FOR INSERT WITH CHECK (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');

DROP POLICY IF EXISTS p_sessions_delete_server ON public.sessions;
CREATE POLICY p_sessions_delete_server
ON public.sessions
FOR DELETE USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');

-- ============================================================================
-- RLS POLICIES: NONCES
-- ============================================================================

DROP POLICY IF EXISTS p_nonces_server_rw ON public.nonces;
CREATE POLICY p_nonces_server_rw
ON public.nonces
USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role')
WITH CHECK (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');

-- ============================================================================
-- RLS POLICIES: REFERRALS
-- ============================================================================

DROP POLICY IF EXISTS p_referrals_owner_rw ON public.referrals;
CREATE POLICY p_referrals_owner_rw
ON public.referrals
FOR SELECT USING (referrer_profile_id = auth_profile_id() OR referred_profile_id = auth_profile_id());

DROP POLICY IF EXISTS p_referrals_insert_owner ON public.referrals;
CREATE POLICY p_referrals_insert_owner
ON public.referrals
FOR INSERT WITH CHECK (referrer_profile_id = auth_profile_id());

DROP POLICY IF EXISTS p_referrals_update_owner ON public.referrals;
CREATE POLICY p_referrals_update_owner
ON public.referrals
FOR UPDATE USING (referrer_profile_id = auth_profile_id());

DROP POLICY IF EXISTS p_referrals_write_server ON public.referrals;
CREATE POLICY p_referrals_write_server
ON public.referrals
FOR UPDATE USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');

-- ============================================================================
-- RLS POLICIES: GAME PLAYS
-- ============================================================================

DROP POLICY IF EXISTS p_game_plays_owner_r ON public.game_plays;
CREATE POLICY p_game_plays_owner_r
ON public.game_plays
FOR SELECT USING (profile_id = auth_profile_id());

DROP POLICY IF EXISTS p_game_plays_write_server ON public.game_plays;
CREATE POLICY p_game_plays_write_server
ON public.game_plays
FOR INSERT WITH CHECK (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');

DROP POLICY IF EXISTS p_game_plays_update_server ON public.game_plays;
CREATE POLICY p_game_plays_update_server
ON public.game_plays
FOR UPDATE USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');

-- ============================================================================
-- RLS POLICIES: REFERRAL CREDITS
-- ============================================================================

DROP POLICY IF EXISTS p_referral_credits_owner_r ON public.referral_credits;
CREATE POLICY p_referral_credits_owner_r
ON public.referral_credits
FOR SELECT USING (referrer_profile_id = auth_profile_id() OR referred_profile_id = auth_profile_id());

DROP POLICY IF EXISTS p_referral_credits_write_server ON public.referral_credits;
CREATE POLICY p_referral_credits_write_server
ON public.referral_credits
FOR INSERT WITH CHECK (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');

-- ============================================================================
-- RLS POLICIES: CREDIT TRANSACTIONS
-- ============================================================================

DROP POLICY IF EXISTS p_credit_transactions_owner_r ON public.credit_transactions;
CREATE POLICY p_credit_transactions_owner_r
ON public.credit_transactions
FOR SELECT USING (profile_id = auth_profile_id());

DROP POLICY IF EXISTS p_credit_transactions_write_server ON public.credit_transactions;
CREATE POLICY p_credit_transactions_write_server
ON public.credit_transactions
FOR INSERT WITH CHECK (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');

-- ============================================================================
-- RLS POLICIES: GAMES
-- ============================================================================

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

-- ============================================================================
-- RLS POLICIES: ADMIN ROLES
-- ============================================================================

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

-- ============================================================================
-- RLS POLICIES: TREASURY BALANCES
-- ============================================================================

DROP POLICY IF EXISTS p_treasury_admin_read ON public.treasury_balances;
CREATE POLICY p_treasury_admin_read
ON public.treasury_balances
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE profile_id = auth_profile_id()
  )
);

-- ============================================================================
-- RLS POLICIES: DAILY STATS
-- ============================================================================

DROP POLICY IF EXISTS p_daily_stats_admin_read ON public.daily_stats;
CREATE POLICY p_daily_stats_admin_read
ON public.daily_stats
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE profile_id = auth_profile_id()
  )
);
