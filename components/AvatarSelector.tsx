'use client';

import { useRef, useState } from 'react';
import AvatarEditor from 'react-avatar-editor';
import Button from './Button';
import GenericAvatarSelector from './GenericAvatarSelector';

type AvatarMode = 'none' | 'generic' | 'upload';

export interface AvatarSelection {
  mode: 'generic' | 'upload';
  genericAvatarId?: string;
  uploadedFile?: File;
  editorRef?: React.RefObject<AvatarEditor | null>;
  scale?: number;
}

interface AvatarSelectorProps {
  onSelectionChange?: (selection: AvatarSelection | null) => void;
  allowCustomUpload?: boolean;
  allowGenericAvatars?: boolean;
}

/**
 * Unified avatar selection component
 *
 * Supports both generic preset avatars and custom image uploads.
 * Can be used in onboarding flow, profile editing, or any avatar selection context.
 */
export default function AvatarSelector({
  onSelectionChange,
  allowCustomUpload = true,
  allowGenericAvatars = true,
}: AvatarSelectorProps) {
  const [avatarMode, setAvatarMode] = useState<AvatarMode>('none');
  const [selectedGenericAvatar, setSelectedGenericAvatar] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [scale, setScale] = useState(1.2);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const editorRef = useRef<AvatarEditor>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setError('Please upload a valid image file (JPG, PNG, WebP, or GIF)');
      return;
    }

    // Compress if needed
    const processedFile = await compressImage(file);
    setUploadedImage(processedFile);
    setAvatarMode('upload');
    setSelectedGenericAvatar(null);
    setError(null);

    // Notify parent
    onSelectionChange?.({
      mode: 'upload',
      uploadedFile: processedFile,
      editorRef,
      scale,
    });
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

  const handleGenericAvatarSelect = (avatarId: string) => {
    setSelectedGenericAvatar(avatarId);
    setAvatarMode('generic');
    setUploadedImage(null);
    setError(null);

    // Notify parent
    onSelectionChange?.({
      mode: 'generic',
      genericAvatarId: avatarId,
    });
  };

  const handleModeSwitch = (mode: 'generic' | 'upload') => {
    if (mode === 'generic') {
      setAvatarMode(selectedGenericAvatar ? 'generic' : 'none');
      setUploadedImage(null);

      if (selectedGenericAvatar) {
        onSelectionChange?.({
          mode: 'generic',
          genericAvatarId: selectedGenericAvatar,
        });
      } else {
        onSelectionChange?.(null);
      }
    } else if (mode === 'upload') {
      setAvatarMode('upload');
      setSelectedGenericAvatar(null);
      onSelectionChange?.(null);
    }
  };

  const handleScaleChange = (newScale: number) => {
    setScale(newScale);

    // Update parent with new scale
    if (avatarMode === 'upload' && uploadedImage) {
      onSelectionChange?.({
        mode: 'upload',
        uploadedFile: uploadedImage,
        editorRef,
        scale: newScale,
      });
    }
  };

  const handleClearUpload = () => {
    setAvatarMode('none');
    setUploadedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onSelectionChange?.(null);
  };

  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleDropZoneKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleDropZoneClick();
    }
  };

  // If both options are disabled, render nothing
  if (!allowCustomUpload && !allowGenericAvatars) {
    return null;
  }

  // If only one option is available, skip the mode selector
  const showModeSelector = allowCustomUpload && allowGenericAvatars;

  return (
    <div className="space-y-4">
      {/* Error display */}
      {error && (
        <div className="p-3 bg-error-100 dark:bg-error-500/20 border border-error-300 dark:border-error-500/30 rounded-lg">
          <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
        </div>
      )}

      {/* Tab selector - only show if both options are enabled */}
      {showModeSelector && (
        <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
          <button
            onClick={() => handleModeSwitch('generic')}
            className={`
              flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
              ${
                avatarMode === 'generic' || avatarMode === 'none'
                  ? 'bg-white dark:bg-neutral-700 text-warning-600 dark:text-warning-400 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }
            `}
          >
            Choose Preset
          </button>
          <button
            onClick={() => handleModeSwitch('upload')}
            className={`
              flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
              ${
                avatarMode === 'upload'
                  ? 'bg-white dark:bg-neutral-700 text-warning-600 dark:text-warning-400 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }
            `}
          >
            Upload Image
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Generic avatar selector */}
      {allowGenericAvatars && (avatarMode === 'none' || avatarMode === 'generic') && (
        <GenericAvatarSelector
          selectedAvatarId={selectedGenericAvatar}
          onSelect={handleGenericAvatarSelect}
        />
      )}

      {/* Upload tab content */}
      {allowCustomUpload && avatarMode === 'upload' && (
        <div className="space-y-4">
          {/* Upload drop zone - only show when no image is uploaded */}
          {!uploadedImage && (
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
                    ? 'border-warning-500 bg-warning-50 dark:bg-warning-500/10'
                    : 'border-warning-300 dark:border-warning-500/30 hover:border-warning-500 dark:hover:border-warning-500/50 hover:bg-warning-50 dark:hover:bg-warning-500/5'
                }
              `}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="text-4xl">
                  {isDragging ? '📥' : '📷'}
                </div>
                <div>
                  <p className="text-warning-500 dark:text-warning-400 font-bold text-lg">
                    {isDragging ? 'Drop image here' : 'Choose an image'}
                  </p>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-2">
                    Click to browse or drag and drop
                  </p>
                  <p className="text-neutral-600 dark:text-neutral-500 text-xs mt-1">
                    JPG, PNG, WebP, or GIF • Max 2MB
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Image editor - show when image is uploaded */}
          {uploadedImage && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4 p-4 border-2 border-warning-300 dark:border-warning-500/30 rounded-xl bg-neutral-100 dark:bg-neutral-900/50">
                <AvatarEditor
                  ref={editorRef}
                  image={uploadedImage}
                  width={200}
                  height={200}
                  border={20}
                  borderRadius={100}
                  color={[0, 0, 0, 0.6]}
                  scale={scale}
                  rotate={0}
                  className="rounded-lg"
                />

                <div className="w-full space-y-2">
                  <label className="block text-sm font-semibold text-warning-500 dark:text-warning-400">
                    Zoom: {scale.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={scale}
                    onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-neutral-300 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearUpload}
                className="w-full"
              >
                Choose Different Image
              </Button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
