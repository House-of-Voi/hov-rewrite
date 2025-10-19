import { createClient } from '@supabase/supabase-js';

// Server-side Supabase admin client (uses service role key, bypasses RLS)
// Only use this in server components and API routes
export function createAdminClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient(url, key, {
    auth: {
      persistSession: false
    }
  });
}
