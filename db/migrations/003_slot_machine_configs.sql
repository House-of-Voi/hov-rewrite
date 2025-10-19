-- Phase 2: Slot Machine Configurations
-- Stores configuration for each slot machine game contract

-- Create slot_machine_configs table
CREATE TABLE IF NOT EXISTS public.slot_machine_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identification
  name TEXT NOT NULL UNIQUE, -- Internal identifier (e.g., 'alpha-1', 'beta-slots')
  display_name TEXT NOT NULL, -- User-facing name (e.g., 'Alpha Slots')
  description TEXT,
  theme TEXT, -- e.g., 'classic', 'fruit', 'space'

  -- Blockchain Configuration
  contract_id BIGINT NOT NULL UNIQUE, -- Voi app ID
  chain chain_type NOT NULL DEFAULT 'voi',
  treasury_address TEXT, -- Optional explicit treasury address

  -- Game Mechanics
  rtp_target NUMERIC(5,2) NOT NULL, -- e.g., 96.50 (%)
  house_edge NUMERIC(5,2) NOT NULL, -- e.g., 3.50 (%)
  min_bet BIGINT NOT NULL, -- In microVOI (e.g., 1000000 = 1 VOI)
  max_bet BIGINT NOT NULL, -- In microVOI
  max_paylines INTEGER NOT NULL DEFAULT 20,

  -- Reel Configuration (JSONB for flexibility)
  reel_config JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  launched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deprecated_at TIMESTAMPTZ, -- When the game was retired

  -- Metadata
  version INTEGER NOT NULL DEFAULT 1, -- For tracking config changes
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT valid_rtp CHECK (rtp_target >= 0 AND rtp_target <= 100),
  CONSTRAINT valid_house_edge CHECK (house_edge >= 0 AND house_edge <= 100),
  CONSTRAINT valid_bet_range CHECK (min_bet > 0 AND max_bet >= min_bet)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_slot_configs_active ON public.slot_machine_configs(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_slot_configs_contract ON public.slot_machine_configs(contract_id);
CREATE INDEX IF NOT EXISTS idx_slot_configs_chain ON public.slot_machine_configs(chain);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_slot_configs_updated_at ON public.slot_machine_configs;
CREATE TRIGGER trg_slot_configs_updated_at
BEFORE UPDATE ON public.slot_machine_configs
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS Policies
ALTER TABLE public.slot_machine_configs ENABLE ROW LEVEL SECURITY;

-- Public can read active configs
DROP POLICY IF EXISTS p_slot_configs_public_read ON public.slot_machine_configs;
CREATE POLICY p_slot_configs_public_read
ON public.slot_machine_configs
FOR SELECT USING (is_active = true);

-- Admins can manage all configs
DROP POLICY IF EXISTS p_slot_configs_admin_all ON public.slot_machine_configs;
CREATE POLICY p_slot_configs_admin_all
ON public.slot_machine_configs
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE profile_id = auth_profile_id()
    AND role IN ('owner', 'operator')
  )
);

-- Insert the Alpha Slots configuration (contract ID 40879920)
INSERT INTO public.slot_machine_configs (
  name,
  display_name,
  description,
  theme,
  contract_id,
  chain,
  rtp_target,
  house_edge,
  min_bet,
  max_bet,
  max_paylines,
  reel_config,
  is_active,
  version
) VALUES (
  'alpha-1',
  'Alpha Slots',
  'Classic 5-reel slot machine with massive jackpots',
  'classic',
  40879920,
  'voi',
  96.50,
  3.50,
  1000000,      -- 1 VOI in microVOI
  100000000,    -- 100 VOI in microVOI
  20,
  '{
    "reelCount": 5,
    "reelLength": 100,
    "windowLength": 3,
    "reels": [
      [0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9],
      [0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9],
      [0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9],
      [0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9],
      [0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9]
    ],
    "paylines": [
      [1,1,1,1,1],
      [0,0,0,0,0],
      [2,2,2,2,2],
      [0,1,2,1,0],
      [2,1,0,1,2],
      [0,0,1,0,0],
      [2,2,1,2,2],
      [1,0,0,0,1],
      [1,2,2,2,1],
      [0,2,1,2,0],
      [2,0,1,0,2],
      [1,1,0,1,1],
      [1,1,2,1,1],
      [0,1,0,1,0],
      [2,1,2,1,2],
      [1,0,1,0,1],
      [1,2,1,2,1],
      [0,0,2,0,0],
      [2,2,0,2,2],
      [0,2,2,2,0]
    ],
    "payouts": {
      "0": {"3": 5, "4": 10, "5": 25},
      "1": {"3": 10, "4": 25, "5": 100},
      "2": {"3": 8, "4": 20, "5": 75},
      "3": {"3": 15, "4": 35, "5": 150},
      "4": {"3": 12, "4": 30, "5": 125},
      "5": {"3": 6, "4": 12, "5": 50},
      "6": {"3": 20, "4": 50, "5": 250},
      "7": {"3": 50, "4": 200, "5": 1000},
      "8": {"3": 3, "4": 7, "5": 20},
      "9": {"3": 4, "4": 8, "5": 25}
    },
    "symbolNames": ["cherry", "lemon", "orange", "plum", "bell", "bar", "seven", "diamond", "star", "wild"]
  }'::jsonb,
  true,
  1
) ON CONFLICT DO NOTHING;
