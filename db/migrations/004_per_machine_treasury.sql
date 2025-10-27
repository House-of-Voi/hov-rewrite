-- Migration: Per-Machine Treasury System
-- Refactors treasury_balances from per-chain to per-contract (per-machine)

-- Drop existing treasury_balances table
DROP TABLE IF EXISTS public.treasury_balances CASCADE;

-- Create new treasury_balances table with contract_id
CREATE TABLE public.treasury_balances (
  contract_id BIGINT NOT NULL,              -- Links to slot_machine_configs.contract_id or games contract
  chain chain_type NOT NULL,
  game_type game_type,                      -- 'slots', 'keno', 'roulette' for grouping
  game_name TEXT,                           -- Display name (e.g., 'Alpha Slots')
  balance DECIMAL NOT NULL DEFAULT 0,
  reserved DECIMAL NOT NULL DEFAULT 0,      -- Amount reserved for pending payouts
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (contract_id, chain)
);

-- Create indexes for efficient querying
CREATE INDEX idx_treasury_chain ON public.treasury_balances(chain);
CREATE INDEX idx_treasury_game_type ON public.treasury_balances(game_type);
CREATE INDEX idx_treasury_contract ON public.treasury_balances(contract_id);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trg_treasury_updated_at ON public.treasury_balances;
CREATE TRIGGER trg_treasury_updated_at
BEFORE UPDATE ON public.treasury_balances
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Enable RLS
ALTER TABLE public.treasury_balances ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can read treasury data
DROP POLICY IF EXISTS p_treasury_admin_read ON public.treasury_balances;
CREATE POLICY p_treasury_admin_read
ON public.treasury_balances
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE profile_id = auth_profile_id()
  )
);

-- RLS Policy: Owners/Operators can manage treasury
DROP POLICY IF EXISTS p_treasury_admin_manage ON public.treasury_balances;
CREATE POLICY p_treasury_admin_manage
ON public.treasury_balances
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE profile_id = auth_profile_id()
    AND role IN ('owner', 'operator')
  )
);

-- Seed initial treasury data for Alpha Slots (contract 40879920)
INSERT INTO public.treasury_balances (contract_id, chain, game_type, game_name, balance, reserved)
VALUES (40879920, 'voi', 'slots', 'Alpha Slots', 0, 0)
ON CONFLICT (contract_id, chain) DO NOTHING;

-- Optional: Update daily_stats to include contract_id for per-machine historical tracking
-- Note: This is additive and won't break existing data
ALTER TABLE public.daily_stats ADD COLUMN IF NOT EXISTS contract_id BIGINT;

-- Update unique constraint to include contract_id
ALTER TABLE public.daily_stats DROP CONSTRAINT IF EXISTS daily_stats_date_chain_key;
ALTER TABLE public.daily_stats ADD CONSTRAINT daily_stats_unique UNIQUE(date, chain, contract_id);

-- Create index for contract_id lookups
CREATE INDEX IF NOT EXISTS idx_daily_stats_contract ON public.daily_stats(contract_id);

-- Comment explaining the new structure
COMMENT ON TABLE public.treasury_balances IS 'Treasury balances per game contract/machine. Each contract has its own treasury on each chain.';
COMMENT ON COLUMN public.treasury_balances.contract_id IS 'Contract/App ID on the blockchain (e.g., 40879920 for Alpha Slots)';
COMMENT ON COLUMN public.treasury_balances.game_name IS 'Human-readable name displayed in admin UI';
