'use client';

import { useState } from 'react';
import OnboardingModal from './OnboardingModal';

interface OnboardingProviderProps {
  needsOnboarding: boolean;
  primaryEmail: string;
  children: React.ReactNode;
}

/**
 * OnboardingProvider
 *
 * Wraps the app and shows the onboarding modal when a user
 * needs to complete onboarding (display_name is null).
 *
 * Cannot be dismissed until onboarding is complete.
 */
export default function OnboardingProvider({
  needsOnboarding: initialNeedsOnboarding,
  primaryEmail,
  children,
}: OnboardingProviderProps) {
  const [needsOnboarding, setNeedsOnboarding] = useState(initialNeedsOnboarding);

  const handleOnboardingComplete = () => {
    setNeedsOnboarding(false);
    // Force a full page reload to update the session with the new display name
    window.location.reload();
  };

  return (
    <>
      {needsOnboarding && (
        <OnboardingModal
          isOpen={true}
          email={primaryEmail}
          onComplete={handleOnboardingComplete}
        />
      )}
      {children}
    </>
  );
}
