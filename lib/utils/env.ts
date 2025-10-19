import { z } from 'zod';

const ServerEnv = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).catch('development'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10),
  NEXT_PUBLIC_CDP_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_CDP_API_KEY_NAME: z.string().min(1),
  CDP_API_KEY_PRIVATE_KEY: z.string().min(10),
});

export const env = ServerEnv.parse({
  NODE_ENV: process.env.NODE_ENV,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_CDP_PROJECT_ID: process.env.NEXT_PUBLIC_CDP_PROJECT_ID,
  NEXT_PUBLIC_CDP_API_KEY_NAME: process.env.NEXT_PUBLIC_CDP_API_KEY_NAME,
  CDP_API_KEY_PRIVATE_KEY: process.env.CDP_API_KEY_PRIVATE_KEY,
});

export const DEMO_MODE = false;
