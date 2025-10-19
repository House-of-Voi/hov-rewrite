import { createClient } from '@supabase/supabase-js';

// Browser-side Supabase client (uses anon key, respects RLS)
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false
    }
  }
);
