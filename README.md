# House of Voi — Scaffold

## Quickstart
1. `cp .env.example .env.local` and fill the values.
2. Create Supabase project and execute `db/schema.sql`.
3. `npm i` then `npm run dev`.

### Coinbase OTP (PLACEHOLDER)
Wire the Coinbase Embedded Wallet OTP on `/auth`. Follow the flow inside `app/auth/page.tsx` and the API routes under `app/api/auth`.

## Scripts
- `dev`, `build`, `start`, `lint`

## Notes
- No fallbacks are implemented. Missing envs will fail build/boot.
- RLS is enabled; server writes use Service Role.
