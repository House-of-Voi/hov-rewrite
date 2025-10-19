import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/profile/session';
import { updateProfile } from '@/lib/profile/data';
import { uploadAvatar, deleteAvatar } from '@/lib/storage/avatars';

/**
 * POST /api/profile/avatar
 *
 * Upload a new avatar image for the authenticated user
 *
 * Request: FormData with 'avatar' file field
 * Response: { success: true, data: { avatar_url: string, profile: Profile } }
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const profileData = await getCurrentProfile();

    if (!profileData) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Upload to Supabase Storage
    const uploadResult = await uploadAvatar(profileData.profile.id, file);

    if ('error' in uploadResult) {
      return NextResponse.json({ error: uploadResult.error }, { status: 400 });
    }

    // Delete old avatar if exists
    if (profileData.profile.avatar_url) {
      // Fire and forget - don't wait for deletion
      deleteAvatar(profileData.profile.avatar_url).catch((err) =>
        console.error('Failed to delete old avatar:', err)
      );
    }

    // Update profile with new avatar URL
    const updatedProfile = await updateProfile(profileData.profile.id, {
      avatar_url: uploadResult.url,
    });

    if (!updatedProfile) {
      return NextResponse.json(
        { error: 'Failed to update profile with avatar URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        avatar_url: uploadResult.url,
        profile: updatedProfile,
      },
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload avatar',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profile/avatar
 *
 * Delete the authenticated user's avatar
 *
 * Response: { success: true, data: { profile: Profile } }
 */
export async function DELETE() {
  try {
    // Verify authentication
    const profileData = await getCurrentProfile();

    if (!profileData) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const currentAvatarUrl = profileData.profile.avatar_url;

    // Update profile to remove avatar URL
    const updatedProfile = await updateProfile(profileData.profile.id, {
      avatar_url: null,
    });

    if (!updatedProfile) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    // Delete file from storage if exists
    if (currentAvatarUrl) {
      deleteAvatar(currentAvatarUrl).catch((err) =>
        console.error('Failed to delete avatar file:', err)
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        profile: updatedProfile,
      },
    });
  } catch (error) {
    console.error('Avatar deletion error:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete avatar',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
