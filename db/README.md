# House of Voi - Database Setup Guide

This guide will help you set up your Supabase database for the House of Voi platform.

## Prerequisites

- A Supabase project created at [supabase.com](https://supabase.com)
- Access to your Supabase project dashboard
- Your Supabase credentials (URL, anon key, service role key)

## Overview

The database consists of:
- **Authentication & User Management**: Profiles, accounts, sessions, nonces
- **Referral System**: Referral codes, credits, and transactions
- **Gaming System**: Game configurations, game plays, and results
- **Admin System**: Admin roles, treasury balances, and statistics

## Step 1: Configure Environment Variables

Before running the SQL, make sure your `.env.local` file has all required Supabase credentials:

```bash
# Database (Supabase)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# PUBLIC (client) env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# JWT Secret (minimum 32 characters)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-chars

# Coinbase CDP credentials
NEXT_PUBLIC_CDP_PROJECT_ID=your-cdp-project-id
NEXT_PUBLIC_CDP_API_KEY_NAME=organizations/your-org/apiKeys/your-key-id
CDP_API_KEY_PRIVATE_KEY=your-cdp-private-key
```

You can find these credentials in your Supabase project settings:
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the **Project URL** (SUPABASE_URL)
4. Copy the **anon/public** key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
5. Copy the **service_role** key (SUPABASE_SERVICE_ROLE_KEY)

## Step 2: Run the Schema SQL

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `db/schema.sql`
5. Paste it into the SQL editor
6. Click **Run** or press `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows)

This will create:
- All database tables
- Enums (chain_type, wallet_provider, game_type, etc.)
- Indexes for performance
- Row Level Security (RLS) policies
- Triggers for updated_at timestamps

**Expected output**: The query should complete successfully with no errors.

## Step 3: Run the Seed Data SQL

1. In the same SQL Editor, create a new query
2. Copy the entire contents of `db/seed.sql`
3. Paste it into the SQL editor
4. Click **Run**

This will insert:
- 3 default games (Slots, Keno, Roulette) with proper configurations
- Treasury balance records for all chains (Base, Voi, Solana)

**Expected output**: The query should complete successfully with no errors.

## Step 4: (Optional) Create Your Admin User

To grant yourself admin access:

1. First, sign up through your application normally to create a profile
2. In Supabase dashboard, go to **Table Editor** → **profiles**
3. Find your profile and copy your `id` (UUID)
4. Go back to **SQL Editor** and run this query (replace `YOUR-PROFILE-UUID` with your actual UUID):

```sql
INSERT INTO public.admin_roles (profile_id, role, granted_by, permissions)
VALUES (
  'YOUR-PROFILE-UUID-HERE',
  'owner',
  NULL,
  '{
    "can_manage_games": true,
    "can_view_stats": true,
    "can_manage_admins": true,
    "can_view_treasury": true
  }'::jsonb
)
ON CONFLICT (profile_id) DO UPDATE
SET role = EXCLUDED.role,
    permissions = EXCLUDED.permissions;
```

## Step 5: Verify Setup

Run these verification queries in the SQL Editor:

```sql
-- Check that all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verify games were seeded
SELECT game_type, name, active FROM public.games;

-- Verify treasury balances
SELECT chain, balance, reserved FROM public.treasury_balances;

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;
```

**Expected results:**
- 12 tables should be listed (profiles, accounts, sessions, nonces, referrals, etc.)
- 3 games should appear (slots, keno, roulette)
- 3 treasury balance records (base, voi, solana with 0 balance)
- All 12 tables should have `rowsecurity = true`

## Database Schema Overview

### Core Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (one per user) |
| `accounts` | Blockchain accounts linked to profiles |
| `sessions` | Active user sessions for JWT tracking |
| `nonces` | Authentication nonces for wallet signatures |

### Referral Tables

| Table | Purpose |
|-------|---------|
| `referrals` | Referral codes and tracking |
| `referral_credits` | Credits earned from referrals |
| `credit_transactions` | Ledger for all credit movements |

### Game Tables

| Table | Purpose |
|-------|---------|
| `games` | Game configurations (slots, keno, roulette) |
| `game_plays` | Individual game rounds/plays |

### Admin Tables

| Table | Purpose |
|-------|---------|
| `admin_roles` | Admin users and permissions |
| `treasury_balances` | House treasury per chain |
| `daily_stats` | Daily statistics snapshots |

## Security Features

### Row Level Security (RLS)

All tables have RLS enabled with policies that:
- Users can only read/update their own data
- Server (service role) can write authentication and game data
- Admins have elevated permissions for management tables

### Helper Functions

- `auth_profile_id()`: Extracts the authenticated user's profile ID from JWT
- `set_updated_at()`: Trigger function to auto-update `updated_at` timestamps

## Supported Game Types

The `game_type` enum includes:
- `slots` - 5-reel slot machine
- `keno` - Lottery-style number picking game
- `roulette` - European roulette (single zero)

## Supported Chains

The `chain_type` enum includes:
- `base` - Base (EVM chain)
- `voi` - Voi blockchain
- `solana` - Solana blockchain

## Troubleshooting

### Error: "role 'authenticator' already exists"
This is safe to ignore - the extensions are already created.

### Error: "permission denied for table X"
Make sure you're using the service role key when running these queries in the SQL editor.

### Error: "duplicate key value violates unique constraint"
This means the data already exists. This is safe to ignore for seed data as it uses `ON CONFLICT DO NOTHING`.

### Tables are created but can't read data
Check that RLS policies are set up correctly. Run the verification query for RLS in Step 5.

## Next Steps

After completing the database setup:

1. Restart your Next.js development server: `npm run dev`
2. The app will now use the real Supabase database instead of demo mode
3. Test authentication by signing in with a wallet
4. Verify your profile appears in the `profiles` table
5. If you created an admin user, verify you can access admin pages

## Migration Notes

If you need to update the schema in the future:
1. Create a new migration file in `db/migrations/`
2. Name it with a number prefix: `003_your_migration_name.sql`
3. Run it manually in the SQL editor
4. Document the changes in this README

## Support

If you encounter issues:
1. Check the Supabase logs in your dashboard (**Logs** → **Postgres**)
2. Verify all environment variables are set correctly
3. Ensure your Supabase project is active and not paused
