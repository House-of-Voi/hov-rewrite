'use client';

import { useState, useRef, useEffect } from 'react';
import { useSignOut } from '@coinbase/cdp-hooks';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';
import GenericAvatarSelector from './GenericAvatarSelector';
import AvatarEditor from 'react-avatar-editor';
import { generateAvatarDataUrl, GENERIC_AVATARS } from '@/lib/utils/genericAvatars';

interface OnboardingModalProps {
  isOpen: boolean;
  email: string;
  onComplete: () => void;
}

type Step = 'name' | 'referral' | 'avatar';
type AvatarMode = 'none' | 'generic' | 'upload';

/**
 * Onboarding modal for first-time users
 *
 * Captures required information from new users:
 * 1. Display name (required)
 * 2. Referral code (optional, pre-filled from cookie)
 * 3. Avatar selection (optional, generic or upload)
 *
 * Cannot be dismissed until the name is provided.
 */
export default function OnboardingModal({
  isOpen,
  email,
  onComplete,
}: OnboardingModalProps) {
  const [step, setStep] = useState<Step>('name');
  const [displayName, setDisplayName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [avatarMode, setAvatarMode] = useState<AvatarMode>('none');
  const [selectedGenericAvatar, setSelectedGenericAvatar] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [scale, setScale] = useState(1.2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReferralBypass, setShowReferralBypass] = useState(false);

  const editorRef = useRef<AvatarEditor>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { signOut } = useSignOut();

  const handleSignOut = async () => {
    try {
      await signOut();
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/auth';
    } catch (error) {
      console.error('Logout error:', error);
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/auth';
    }
  };

  // Load referral code from cookie on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const cookies = document.cookie.split(';');
    const refCookie = cookies.find(c => c.trim().startsWith('hov_ref='));
    if (refCookie) {
      const code = refCookie.split('=')[1];
      setReferralCode(code.toUpperCase());
    }
  }, []);

  const stepIndex = step === 'name' ? 0 : step === 'referral' ? 1 : 2;
  const totalSteps = 3;

  const canProceedFromName = displayName.trim().length > 0;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPG, PNG, WebP, or GIF)');
      return;
    }

    setUploadedImage(file);
    setAvatarMode('upload');
    setSelectedGenericAvatar(null);
    setError(null);
  };

  const handleGenericAvatarSelect = (avatarId: string) => {
    setSelectedGenericAvatar(avatarId);
    setAvatarMode('generic');
    setUploadedImage(null);
    setError(null);
  };

  const handleNext = async () => {
    if (step === 'name' && canProceedFromName) {
      setStep('referral');
      setError(null);
      setShowReferralBypass(false);
    } else if (step === 'referral') {
      // Validate referral code if provided
      if (referralCode.trim()) {
        setIsSubmitting(true);
        setError(null);
        setShowReferralBypass(false);

        try {
          const response = await fetch('/api/referrals/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: referralCode.trim().toUpperCase() }),
          });

          const result = await response.json();

          if (!response.ok || !result.valid) {
            setError(result.error || 'Invalid referral code');
            setShowReferralBypass(true);
            setIsSubmitting(false);
            return;
          }

          // Valid code, proceed to avatar step
          setStep('avatar');
          setError(null);
          setShowReferralBypass(false);
        } catch (err) {
          setError('Failed to validate referral code');
          setShowReferralBypass(true);
          console.error('Referral validation error:', err);
        } finally {
          setIsSubmitting(false);
        }
      } else {
        // No code provided, skip validation
        setStep('avatar');
        setError(null);
        setShowReferralBypass(false);
      }
    }
  };

  const handleBypassReferral = () => {
    setReferralCode('');
    setError(null);
    setShowReferralBypass(false);
    setStep('avatar');
  };

  const handleBack = () => {
    if (step === 'referral') {
      setStep('name');
    } else if (step === 'avatar') {
      setStep('referral');
    }
  };

  const handleSkipStep = () => {
    if (step === 'referral') {
      setStep('avatar');
    } else if (step === 'avatar') {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    if (!displayName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Update profile with display name
      const profileResponse = await fetch('/api/profile/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName.trim(),
        }),
      });

      if (!profileResponse.ok) {
        const result = await profileResponse.json();
        throw new Error(result.error || 'Failed to update profile');
      }

      const profileResult = await profileResponse.json();
      if (!profileResult.success) {
        throw new Error('Profile update failed');
      }

      // 2. Link referral code if provided
      if (referralCode.trim()) {
        const referralResponse = await fetch('/api/profile/link-referral', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            referralCode: referralCode.trim().toUpperCase(),
          }),
        });

        // Don't fail onboarding if referral linking fails, just log it
        if (!referralResponse.ok) {
          const result = await referralResponse.json();
          console.warn('Referral linking failed:', result.error);
        }
      }

      // 3. Set avatar if selected
      if (avatarMode === 'generic' && selectedGenericAvatar) {
        // Generate the data URL for the generic avatar
        const avatar = GENERIC_AVATARS.find(a => a.id === selectedGenericAvatar);
        if (avatar) {
          const dataUrl = generateAvatarDataUrl(avatar);

          // Convert data URL to blob and upload
          const response = await fetch(dataUrl);
          const blob = await response.blob();

          const formData = new FormData();
          formData.append('avatar', blob, `${avatar.id}.svg`);

          const avatarResponse = await fetch('/api/profile/avatar', {
            method: 'POST',
            body: formData,
          });

          if (!avatarResponse.ok) {
            const result = await avatarResponse.json();
            console.warn('Avatar upload failed:', result.error);
            // Don't fail onboarding, just log the error
          }
        }
      } else if (avatarMode === 'upload' && editorRef.current && uploadedImage) {
        // Get cropped image from editor
        const canvas = editorRef.current.getImageScaledToCanvas();

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

        const avatarResponse = await fetch('/api/profile/avatar', {
          method: 'POST',
          body: formData,
        });

        if (!avatarResponse.ok) {
          const result = await avatarResponse.json();
          console.warn('Avatar upload failed:', result.error);
          // Don't fail onboarding, just log the error
        }
      }

      // Success! Clear referral cookie
      if (typeof window !== 'undefined') {
        document.cookie = 'hov_ref=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }

      // Complete onboarding - this will trigger a router.refresh()
      onComplete();
    } catch (err) {
      console.error('Onboarding error:', err);
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding');
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // Cannot be closed
      title="Welcome to House of Voi"
      size="lg"
      hideCloseButton={true}
    >
      <div className="space-y-6">
        {/* Sign Out Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSignOut}
            disabled={isSubmitting}
            className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 underline transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-between">
          {['Name', 'Referral', 'Avatar'].map((label, index) => (
            <div key={label} className="flex items-center flex-1">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                  ${
                    index <= stepIndex
                      ? 'bg-warning-500 text-white'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-500'
                  }
                `}
              >
                {index + 1}
              </div>
              <div className="ml-2 flex-1">
                <p
                  className={`text-sm font-semibold ${
                    index <= stepIndex ? 'text-warning-500 dark:text-warning-400' : 'text-neutral-600 dark:text-neutral-500'
                  }`}
                >
                  {label}
                </p>
              </div>
              {index < totalSteps - 1 && (
                <div
                  className={`h-1 flex-1 mx-2 rounded ${
                    index < stepIndex ? 'bg-warning-500' : 'bg-neutral-200 dark:bg-neutral-800'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Error display */}
        {error && (
          <div className="p-3 bg-error-100 dark:bg-error-500/20 border border-error-300 dark:border-error-500/30 rounded-lg space-y-2">
            <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
            {showReferralBypass && (
              <button
                onClick={handleBypassReferral}
                className="text-sm text-error-700 dark:text-error-300 underline hover:no-underline font-medium"
              >
                Proceed without referral code
              </button>
            )}
          </div>
        )}

        {/* Step content */}
        <div className="min-h-[300px]">
          {step === 'name' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-warning-500 dark:text-warning-400 mb-2">
                  What should we call you?
                </h3>
                <p className="text-neutral-400 text-sm">
                  This will be your display name on House of Voi
                </p>
              </div>

              <Input
                label="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canProceedFromName) handleNext();
                }}
              />

              <div className="text-xs text-neutral-600 dark:text-neutral-500">
                {email.includes('@') ? 'Email' : 'Phone'}: {email}
              </div>
            </div>
          )}

          {step === 'referral' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-warning-500 dark:text-warning-400 mb-2">
                  Have a referral code?
                </h3>
                <p className="text-neutral-400 text-sm">
                  Enter your code to connect with the person who invited you
                </p>
              </div>

              <Input
                label="Referral Code (Optional)"
                value={referralCode}
                onChange={(e) => {
                  setReferralCode(e.target.value.toUpperCase());
                  setError(null);
                  setShowReferralBypass(false);
                }}
                placeholder="Enter code"
                maxLength={7}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNext();
                }}
              />

              {referralCode && (
                <p className="text-xs text-warning-500 dark:text-warning-400">
                  Code will be validated when you click Next
                </p>
              )}
            </div>
          )}

          {step === 'avatar' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-warning-500 dark:text-warning-400 mb-2">
                  Choose your avatar
                </h3>
                <p className="text-neutral-400 text-sm">
                  Select a preset or upload your own image
                </p>
              </div>

              {/* Avatar mode selector */}
              <div className="flex gap-3 mb-4">
                <Button
                  variant={avatarMode === 'generic' || avatarMode === 'none' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setAvatarMode(selectedGenericAvatar ? 'generic' : 'none');
                    setUploadedImage(null);
                  }}
                  className="flex-1"
                >
                  Choose Preset
                </Button>
                <Button
                  variant={avatarMode === 'upload' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                >
                  Upload Image
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Generic avatar selector */}
              {(avatarMode === 'none' || avatarMode === 'generic') && (
                <GenericAvatarSelector
                  selectedAvatarId={selectedGenericAvatar}
                  onSelect={handleGenericAvatarSelect}
                />
              )}

              {/* Upload editor */}
              {avatarMode === 'upload' && uploadedImage && (
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-4 p-6 border-2 border-warning-300 dark:border-warning-500/30 rounded-xl bg-neutral-100 dark:bg-neutral-900/50">
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
                        onChange={(e) => setScale(parseFloat(e.target.value))}
                        className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAvatarMode('none');
                      setUploadedImage(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="w-full"
                  >
                    Choose Different Image
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3 pt-4 border-t border-neutral-800">
          {step !== 'name' && (
            <Button
              variant="ghost"
              size="md"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Back
            </Button>
          )}

          {step === 'name' ? (
            <Button
              variant="primary"
              size="md"
              onClick={handleNext}
              disabled={!canProceedFromName}
              className="flex-1"
            >
              Next
            </Button>
          ) : step === 'referral' ? (
            <>
              <Button
                variant="ghost"
                size="md"
                onClick={handleSkipStep}
                disabled={isSubmitting}
              >
                Skip
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleNext}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Validating...' : 'Next'}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="md"
                onClick={handleSkipStep}
                disabled={isSubmitting}
              >
                Skip
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleComplete}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Completing...' : 'Complete Setup'}
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
