/**
 * Admin access check endpoint
 * Returns current user's admin role and permissions
 */

import { NextResponse } from 'next/server';
import { getAdminRole, getCurrentProfileId, getEffectivePermissions } from '@/lib/auth/admin';
import type { AdminRoleResponse, ApiResponse } from '@/lib/types/admin';

export async function GET() {
  try {
    const profileId = await getCurrentProfileId();

    if (!profileId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const roleData = await getAdminRole(profileId);

    if (!roleData) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No admin access' },
        { status: 403 }
      );
    }

    const permissions = getEffectivePermissions(roleData);

    const response: AdminRoleResponse = {
      profile_id: roleData.profile_id,
      role: roleData.role,
      permissions,
      granted_by: roleData.granted_by,
      granted_at: roleData.granted_at,
    };

    return NextResponse.json<ApiResponse<AdminRoleResponse>>(
      { success: true, data: response },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error checking admin access:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
