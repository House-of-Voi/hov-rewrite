'use client';

import { useRef, useState, type KeyboardEvent } from 'react';
import AvatarEditor from 'react-avatar-editor';
import Button from './Button';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  onUploadSuccess: (url: string) => void;
  onUploadError: (error: string) => void;
}

/**
 * Avatar upload component with image cropping functionality
 *
 * Features:
 * - File selection with drag & drop support
 * - Image cropping with zoom control
 * - Preview with circular mask
 * - 512x512 output resolution
 * - 2MB file size limit
 */
export default function AvatarUpload({
  currentAvatarUrl,
  onUploadSuccess,
  onUploadError,
}: AvatarUploadProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [scale, setScale] = useState(1.2);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const editorRef = useRef<AvatarEditor>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      onUploadError('File size must be less than 2MB');
      return false;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      onUploadError('Please upload a JPG, PNG, or WebP image');
      return false;
    }

    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (validateFile(file)) {
      setSelectedImage(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (validateFile(file)) {
      setSelectedImage(file);
    }
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
  };

  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleDropZoneKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleDropZoneClick();
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        id="avatar-upload"
      />

      {!selectedImage ? (
        <div
          onClick={handleDropZoneClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onKeyDown={handleDropZoneKeyDown}
          role="button"
          tabIndex={0}
          aria-label="Upload avatar by clicking or dragging an image"
          className={`
            cursor-pointer border-2 border-dashed rounded-xl p-8 text-center transition-all
            ${
              isDragging
                ? 'border-gold-500 bg-gold-500/10'
                : 'border-gold-500/30 hover:border-gold-500/50 hover:bg-gold-500/5'
            }
          `}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="text-4xl">
              {isDragging ? '📥' : '📷'}
            </div>
            <div>
              <p className="text-gold-400 font-semibold">
                {isDragging ? 'Drop image here' : currentAvatarUrl ? 'Change Avatar' : 'Upload Avatar'}
              </p>
              <p className="text-neutral-500 text-sm mt-1">
                Click or drag and drop • JPG, PNG, or WebP • Max 2MB
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

            <div className="w-full max-w-sm space-y-2">
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
                className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload Avatar'}
            </Button>
            <Button variant="ghost" size="md" onClick={handleCancel} disabled={isUploading}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
