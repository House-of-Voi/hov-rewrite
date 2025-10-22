import { createClient } from '@supabase/supabase-js';

const mimirUrl = process.env.MIMIR_SUPABASE_URL;
const mimirAnonKey = process.env.MIMIR_SUPABASE_ANON_KEY;

if (!mimirUrl || !mimirAnonKey) {
  throw new Error(
    'Missing Mimir Supabase credentials. Set MIMIR_SUPABASE_URL and MIMIR_SUPABASE_ANON_KEY.'
  );
}

export const mimirClient = createClient(mimirUrl, mimirAnonKey, {
  auth: {
    persistSession: false,
  },
});

export class MimirRpcError extends Error {
  public readonly code: string | undefined;
  public readonly originalError: unknown;

  constructor(functionName: string, error: unknown) {
    const message =
      error && typeof error === 'object' && 'message' in error
        ? String((error as { message: unknown }).message)
        : 'Unknown error';

    super(`Mimir query failed (${functionName}): ${message}`);
    this.name = 'MimirRpcError';
    this.code =
      error && typeof error === 'object' && 'code' in error
        ? String((error as { code?: unknown }).code)
        : undefined;
    this.originalError = error;
  }
}

export async function mimirRpc<T>(
  functionName: string,
  params?: Record<string, unknown>
): Promise<T> {
  const { data, error } = await mimirClient.rpc(functionName, params);

  if (error) {
    console.error(`Mimir RPC error (${functionName}):`, error);
    throw new MimirRpcError(functionName, error);
  }

  return data as T;
}
