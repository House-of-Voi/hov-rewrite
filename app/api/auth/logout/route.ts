import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/cookies';
import { getServerSessionFromRequest } from '@/lib/auth/session';
import { createClient } from '@/lib/db/supabaseAdmin';
import { DEMO_MODE } from '@/lib/utils/env';
import { clearDemoSession } from '@/lib/demo/session';

export async function POST() {
  // Demo mode: clear in-memory session
  if (DEMO_MODE) {
    console.log('[DEMO] Logout - clearing demo session');
    clearDemoSession();
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  }

  const session = await getServerSessionFromRequest();
  if (session?.jti) {
    const supabase = createClient();
    await supabase.from('sessions').delete().eq('id', session.jti);
  }
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
