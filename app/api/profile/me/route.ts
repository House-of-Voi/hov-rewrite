import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/profile/session';
import { updateProfile } from '@/lib/profile/data';
import { UpdateProfileSchema } from '@/lib/profile/validation';

/**
 * GET /api/profile/me
 *
 * Returns the current authenticated user's profile with all linked accounts
 */
export async function GET() {
  try {
    const profileData = await getCurrentProfile();

    if (!profileData) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: profileData,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch profile',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profile/me
 *
 * Updates the current authenticated user's profile
 *
 * Request body:
 * {
 *   display_name?: string | null,
 *   avatar_url?: string | null
 * }
 */
export async function PATCH(req: NextRequest) {
  try {
    const profileData = await getCurrentProfile();

    if (!profileData) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = UpdateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: parsed.error.errors,
        },
        { status: 400 }
      );
    }

    const { display_name, avatar_url } = parsed.data;

    // Build update object (only include provided fields)
    const updates: {
      display_name?: string | null;
      avatar_url?: string | null;
    } = {};

    if (display_name !== undefined) {
      updates.display_name = display_name;
    }

    if (avatar_url !== undefined) {
      updates.avatar_url = avatar_url;
    }

    // No updates provided
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }

    const updatedProfile = await updateProfile(profileData.profile.id, updates);

    if (!updatedProfile) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        profile: updatedProfile,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update profile',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
