import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/cookies';
import { getServerSessionFromRequest } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/db/supabaseAdmin';
import { DEMO_MODE } from '@/lib/utils/env';
import { clearDemoSession } from '@/lib/demo/session';

async function handleLogout() {
  // Demo mode: clear in-memory session
  if (DEMO_MODE) {
    console.log('[DEMO] Logout - clearing demo session');
    clearDemoSession();
    await clearSessionCookie();
    return NextResponse.redirect(new URL('/auth', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'));
  }

  const session = await getServerSessionFromRequest();
  if (session?.jti) {
    const supabase = createAdminClient();
    await supabase.from('sessions').delete().eq('id', session.jti);
  }
  await clearSessionCookie();
  return NextResponse.redirect(new URL('/auth', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'));
}

export async function POST() {
  return handleLogout();
}

export async function GET() {
  return handleLogout();
}
