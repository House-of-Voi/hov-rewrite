/**
 * Admin Bulk Player Operations API
 * Handle bulk operations like granting access, approving waitlist, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/supabaseAdmin';
import { requirePermission, getCurrentProfileId, PERMISSIONS } from '@/lib/auth/admin';
import type { ApiResponse } from '@/lib/types/admin';

interface BulkGrantAccessRequest {
  player_ids: string[];
}

interface BulkWaitlistApproveRequest {
  count?: number; // Number of users to approve from top of waitlist
  player_ids?: string[]; // Specific player IDs to approve
}

export async function POST(request: NextRequest) {
  try {
    const profileId = await getCurrentProfileId();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (!action) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Action parameter required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    switch (action) {
      case 'grant-access': {
        await requirePermission(PERMISSIONS.GRANT_ACCESS, profileId);
        const body: BulkGrantAccessRequest = await request.json();

        if (!body.player_ids || !Array.isArray(body.player_ids) || body.player_ids.length === 0) {
          return NextResponse.json<ApiResponse>(
            { success: false, error: 'player_ids array required' },
            { status: 400 }
          );
        }

        const { data, error } = await supabase
          .from('profiles')
          .update({ game_access_granted: true })
          .in('id', body.player_ids)
          .select('id, primary_email');

        if (error) {
          console.error('Error granting access:', error);
          return NextResponse.json<ApiResponse>(
            { success: false, error: 'Failed to grant access' },
            { status: 500 }
          );
        }

        return NextResponse.json<ApiResponse>(
          {
            success: true,
            data: { updated: data?.length || 0, players: data },
            message: `Granted access to ${data?.length || 0} player(s)`,
          },
          { status: 200 }
        );
      }

      case 'revoke-access': {
        await requirePermission(PERMISSIONS.GRANT_ACCESS, profileId);
        const body: BulkGrantAccessRequest = await request.json();

        if (!body.player_ids || !Array.isArray(body.player_ids) || body.player_ids.length === 0) {
          return NextResponse.json<ApiResponse>(
            { success: false, error: 'player_ids array required' },
            { status: 400 }
          );
        }

        const { data, error } = await supabase
          .from('profiles')
          .update({ game_access_granted: false })
          .in('id', body.player_ids)
          .select('id, primary_email');

        if (error) {
          console.error('Error revoking access:', error);
          return NextResponse.json<ApiResponse>(
            { success: false, error: 'Failed to revoke access' },
            { status: 500 }
          );
        }

        return NextResponse.json<ApiResponse>(
          {
            success: true,
            data: { updated: data?.length || 0, players: data },
            message: `Revoked access for ${data?.length || 0} player(s)`,
          },
          { status: 200 }
        );
      }

      case 'waitlist-approve': {
        await requirePermission(PERMISSIONS.MANAGE_WAITLIST, profileId);
        const body: BulkWaitlistApproveRequest = await request.json();

        let playerIds: string[] = [];

        if (body.player_ids && Array.isArray(body.player_ids)) {
          // Specific players
          playerIds = body.player_ids;
        } else if (body.count && body.count > 0) {
          // Top N from waitlist
          const { data: waitlistPlayers, error: fetchError } = await supabase
            .from('profiles')
            .select('id')
            .not('waitlist_position', 'is', null)
            .eq('game_access_granted', false)
            .order('waitlist_position', { ascending: true })
            .limit(body.count);

          if (fetchError) {
            console.error('Error fetching waitlist:', fetchError);
            return NextResponse.json<ApiResponse>(
              { success: false, error: 'Failed to fetch waitlist' },
              { status: 500 }
            );
          }

          playerIds = waitlistPlayers?.map(p => p.id) || [];
        } else {
          return NextResponse.json<ApiResponse>(
            { success: false, error: 'Either player_ids or count required' },
            { status: 400 }
          );
        }

        if (playerIds.length === 0) {
          return NextResponse.json<ApiResponse>(
            { success: true, data: { updated: 0 }, message: 'No players to approve' },
            { status: 200 }
          );
        }

        const { data, error } = await supabase
          .from('profiles')
          .update({
            game_access_granted: true,
            waitlist_position: null,
          })
          .in('id', playerIds)
          .select('id, primary_email');

        if (error) {
          console.error('Error approving waitlist:', error);
          return NextResponse.json<ApiResponse>(
            { success: false, error: 'Failed to approve waitlist' },
            { status: 500 }
          );
        }

        return NextResponse.json<ApiResponse>(
          {
            success: true,
            data: { updated: data?.length || 0, players: data },
            message: `Approved ${data?.length || 0} player(s) from waitlist`,
          },
          { status: 200 }
        );
      }

      default:
        return NextResponse.json<ApiResponse>(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error in bulk operations:', error);

    if (error.message?.includes('UNAUTHORIZED') || error.message?.includes('FORBIDDEN')) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: error.message },
        { status: error.message.includes('UNAUTHORIZED') ? 401 : 403 }
      );
    }

    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
