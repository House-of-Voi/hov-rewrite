'use client';

import { useState } from 'react';
import Button from './Button';
import AvatarSelector, { type AvatarSelection } from './AvatarSelector';
import { generateAvatarDataUrl, GENERIC_AVATARS } from '@/lib/utils/genericAvatars';

interface AvatarEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl?: string | null;
  onUploadSuccess: (url: string) => void;
  onUploadError: (error: string) => void;
  onDelete?: () => void;
}

/**
 * Modal for editing/uploading avatar
 *
 * Features:
 * - Generic preset avatars
 * - Custom image upload with cropping
 * - Auto-compresses large images
 * - Delete existing avatar
 */
export default function AvatarEditModal({
  isOpen,
  onClose,
  currentAvatarUrl,
  onUploadSuccess,
  onUploadError,
  onDelete,
}: AvatarEditModalProps) {
  const [avatarSelection, setAvatarSelection] = useState<AvatarSelection | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!avatarSelection) return;

    setIsUploading(true);

    try {
      if (avatarSelection.mode === 'generic' && avatarSelection.genericAvatarId) {
        // Generate the data URL for the generic avatar
        const avatar = GENERIC_AVATARS.find(a => a.id === avatarSelection.genericAvatarId);
        if (!avatar) {
          onUploadError('Selected avatar not found');
          setIsUploading(false);
          return;
        }

        const dataUrl = generateAvatarDataUrl(avatar);

        // Convert data URL to blob and upload
        const response = await fetch(dataUrl);
        const blob = await response.blob();

        const formData = new FormData();
        formData.append('avatar', blob, `${avatar.id}.svg`);

        const uploadResponse = await fetch('/api/profile/avatar', {
          method: 'POST',
          body: formData,
        });

        const result = await uploadResponse.json();

        if (uploadResponse.ok && result.success) {
          onUploadSuccess(result.data.avatar_url);
          setAvatarSelection(null);
          onClose();
        } else {
          onUploadError(result.error || 'Upload failed');
        }
      } else if (
        avatarSelection.mode === 'upload' &&
        avatarSelection.editorRef?.current &&
        avatarSelection.uploadedFile
      ) {
        // Get cropped image from editor
        const canvas = avatarSelection.editorRef.current.getImageScaledToCanvas();

        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Failed to create image blob'));
            },
            'image/webp',
            0.9
          );
        });

        const formData = new FormData();
        formData.append('avatar', blob, 'avatar.webp');

        const uploadResponse = await fetch('/api/profile/avatar', {
          method: 'POST',
          body: formData,
        });

        const result = await uploadResponse.json();

        if (uploadResponse.ok && result.success) {
          onUploadSuccess(result.data.avatar_url);
          setAvatarSelection(null);
          onClose();
        } else {
          onUploadError(result.error || 'Upload failed');
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError('Failed to upload avatar. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setAvatarSelection(null);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isUploading) {
      handleCancel();
    }
  };

  const handleOverlayKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isUploading && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      handleCancel();
    }

    if (event.key === 'Escape' && !isUploading) {
      event.stopPropagation();
      handleCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-neutral-900/50 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleOverlayKeyDown}
      role="button"
      aria-label="Close avatar editor"
      tabIndex={0}
    >
      <div
        className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-warning-300 dark:border-warning-500/30 max-w-lg w-full p-6 space-y-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-modal-title"
      >
        <div className="flex items-center justify-between">
          <h3 id="avatar-modal-title" className="text-2xl font-bold text-warning-500 dark:text-warning-400 uppercase">
            {currentAvatarUrl ? 'Change Avatar' : 'Upload Avatar'}
          </h3>
          <button
            onClick={handleCancel}
            disabled={isUploading}
            className="text-neutral-600 dark:text-neutral-400 hover:text-warning-500 dark:hover:text-warning-400 transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Unified Avatar Selector */}
        <AvatarSelector
          onSelectionChange={setAvatarSelection}
          allowCustomUpload={true}
          allowGenericAvatars={true}
        />

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-neutral-300 dark:border-neutral-700">
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            disabled={isUploading || !avatarSelection}
            className="flex-1"
          >
            {isUploading ? 'Uploading...' : 'Save Avatar'}
          </Button>
          <Button
            variant="ghost"
            size="md"
            onClick={handleCancel}
            disabled={isUploading}
          >
            Cancel
          </Button>
        </div>

        {/* Delete Avatar Button - shown at bottom if avatar exists */}
        {currentAvatarUrl && onDelete && (
          <div className="border-t border-neutral-300 dark:border-neutral-700 pt-4">
            <button
              onClick={onDelete}
              className="w-full px-4 py-3 text-sm font-semibold text-error-600 dark:text-error-400 hover:text-error-700 dark:hover:text-error-300 hover:bg-error-50 dark:hover:bg-error-500/10 rounded-lg transition-colors border-2 border-error-300 dark:border-error-500/30 hover:border-error-500 dark:hover:border-error-500/50"
            >
              Delete Current Avatar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
