import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/db/supabaseAdmin';

const schema = z.object({
  address: z.string().min(1),
  chain: z.enum(['base','voi','solana']),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  const { address, chain } = parsed.data;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);
  const payload = {
    nonce: crypto.randomUUID(),
    issuedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    statement: 'Sign this one-time nonce to authenticate.',
    domain: req.headers.get('host') ?? undefined,
  };

  const supabase = createClient();
  await supabase.from('nonces').upsert({
    address, chain, nonce: payload.nonce, expires_at: expiresAt.toISOString(),
  }, { onConflict: 'chain,address' });

  return NextResponse.json(payload);
}
