'use client';

import { useRef, useState } from 'react';
import AvatarEditor from 'react-avatar-editor';
import Button from './Button';

interface AvatarEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl?: string | null;
  onUploadSuccess: (url: string) => void;
  onUploadError: (error: string) => void;
  onDelete?: () => void;
}

/**
 * Modal for editing/uploading avatar with cropping
 *
 * Features:
 * - Click or drag-and-drop to select image
 * - Auto-compresses large images instead of rejecting
 * - Cropping with zoom control
 * - 512x512 output resolution
 */
export default function AvatarEditModal({
  isOpen,
  onClose,
  currentAvatarUrl,
  onUploadSuccess,
  onUploadError,
  onDelete,
}: AvatarEditModalProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [scale, setScale] = useState(1.2);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const editorRef = useRef<AvatarEditor>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const compressImage = async (file: File): Promise<File> => {
    // If already small enough, return as-is
    if (file.size <= 2 * 1024 * 1024) {
      return file;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Scale down if too large (max 2048px on longest side)
          const maxDimension = 2048;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file); // Fallback to original
              }
            },
            'image/jpeg',
            0.85 // 85% quality
          );
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      onUploadError('Please upload a valid image file (JPG, PNG, WebP, or GIF)');
      return;
    }

    // Compress if needed
    const processedFile = await compressImage(file);
    setSelectedImage(processedFile);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleUpload = async () => {
    if (!editorRef.current || !selectedImage) return;

    setIsUploading(true);

    try {
      // Get cropped image as canvas
      const canvas = editorRef.current.getImageScaledToCanvas();

      // Convert canvas to blob (WebP format for optimal compression)
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create image blob'));
          },
          'image/webp',
          0.9 // Quality 90%
        );
      });

      // Create FormData
      const formData = new FormData();
      formData.append('avatar', blob, 'avatar.webp');

      // Upload to API
      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        onUploadSuccess(result.data.avatar_url);
        setSelectedImage(null);
        setScale(1.2);
        onClose();
      } else {
        onUploadError(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError('Failed to upload avatar. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedImage(null);
    setScale(1.2);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isUploading) {
      handleCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-neutral-900 rounded-xl border-2 border-gold-500/30 max-w-lg w-full p-6 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gold-400 uppercase">
            {currentAvatarUrl ? 'Change Avatar' : 'Upload Avatar'}
          </h3>
          <button
            onClick={handleCancel}
            disabled={isUploading}
            className="text-neutral-400 hover:text-gold-400 transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {!selectedImage ? (
          <div
            onClick={handleDropZoneClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              cursor-pointer border-2 border-dashed rounded-xl p-12 text-center transition-all
              ${
                isDragging
                  ? 'border-gold-500 bg-gold-500/10'
                  : 'border-gold-500/30 hover:border-gold-500/50 hover:bg-gold-500/5'
              }
            `}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="text-5xl">
                {isDragging ? '📥' : '📷'}
              </div>
              <div>
                <p className="text-gold-400 font-bold text-lg">
                  {isDragging ? 'Drop image here' : 'Choose an image'}
                </p>
                <p className="text-neutral-400 text-sm mt-2">
                  Click to browse or drag and drop
                </p>
                <p className="text-neutral-500 text-xs mt-1">
                  Any image format • Any size (we'll optimize it)
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4 p-6 border-2 border-gold-500/30 rounded-xl bg-neutral-900/50">
              <AvatarEditor
                ref={editorRef}
                image={selectedImage}
                width={256}
                height={256}
                border={20}
                borderRadius={128}
                color={[0, 0, 0, 0.6]}
                scale={scale}
                rotate={0}
                className="rounded-lg"
              />

              <div className="w-full space-y-2">
                <label className="block text-sm font-semibold text-gold-400">
                  Zoom: {scale.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={handleUpload}
                disabled={isUploading}
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
          </div>
        )}

        {/* Delete Avatar Button - shown at bottom if avatar exists and no image selected */}
        {currentAvatarUrl && !selectedImage && onDelete && (
          <div className="border-t border-neutral-700 pt-4">
            <button
              onClick={onDelete}
              className="w-full px-4 py-3 text-sm font-semibold text-ruby-400 hover:text-ruby-300 hover:bg-ruby-500/10 rounded-lg transition-colors border-2 border-ruby-500/30 hover:border-ruby-500/50"
            >
              Delete Current Avatar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
