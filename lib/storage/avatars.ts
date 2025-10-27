import { createAdminClient } from '../db/supabaseAdmin';

const BUCKET_NAME = 'avatars';

/**
 * Upload avatar image to Supabase Storage
 *
 * @param profileId - User's profile ID
 * @param file - File or Blob to upload
 * @returns Public URL of uploaded avatar
 */
export async function uploadAvatar(
  profileId: string,
  file: File | Blob
): Promise<{ url: string; path: string } | { error: string }> {
  try {
    const supabase = createAdminClient();

    // Detect file type and extension
    const fileType = file.type || 'image/webp';
    let extension = 'webp';

    if (fileType.includes('svg')) {
      extension = 'svg';
    } else if (fileType.includes('png')) {
      extension = 'png';
    } else if (fileType.includes('jpeg') || fileType.includes('jpg')) {
      extension = 'jpg';
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${profileId}_${timestamp}.${extension}`;
    const filePath = `${filename}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: fileType,
      });

    if (error) {
      console.error('Upload error:', error);
      return { error: `Upload failed: ${error.message}` };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

    return {
      url: publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('Avatar upload error:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Delete avatar file from storage
 *
 * @param avatarUrl - Full public URL of the avatar to delete
 */
export async function deleteAvatar(avatarUrl: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();

    // Extract filename from URL
    // URL format: https://{project}.supabase.co/storage/v1/object/public/avatars/{filename}
    const urlParts = avatarUrl.split('/');
    const filename = urlParts[urlParts.length - 1];

    if (!filename) {
      console.error('Invalid avatar URL format');
      return false;
    }

    const { error } = await supabase.storage.from(BUCKET_NAME).remove([filename]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Avatar deletion error:', error);
    return false;
  }
}

/**
 * Get public URL for an avatar file path
 *
 * @param path - File path in storage bucket
 * @returns Public URL
 */
export function getAvatarPublicUrl(path: string): string {
  const supabase = createAdminClient();

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);

  return publicUrl;
}
