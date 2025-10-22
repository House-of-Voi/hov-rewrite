import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSessionFromRequest } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/db/supabaseAdmin';

const schema = z.object({
  profileId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  // Get authenticated session
  const session = await getServerSessionFromRequest();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Check if user is an admin
  const { data: adminRole } = await supabase
    .from('admin_roles')
    .select('role')
    .eq('profile_id', session.profileId)
    .single();

  if (!adminRole) {
    return NextResponse.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403 }
    );
  }

  const data = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid profile ID' }, { status: 400 });
  }

  const { profileId } = parsed.data;

  // Update the profile to grant game access
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      game_access_granted: true,
    })
    .eq('id', profileId);

  if (updateError) {
    console.error('Failed to grant access:', updateError);
    return NextResponse.json(
      { error: 'Failed to grant game access' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: 'Game access granted successfully',
  });
}
