import React from 'react';
import { getServerSessionFromRequest } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import OnboardingProvider from '@/components/OnboardingProvider';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Check authentication
  const session = await getServerSessionFromRequest();

  if (!session) {
    redirect('/auth');
  }

  // Check if user needs onboarding (display_name is null)
  const needsOnboarding = !session.displayName;

  if (!session.primaryEmail) {
    throw new Error('Session missing primary email - CDP authentication failed');
  }

  return (
    <OnboardingProvider needsOnboarding={needsOnboarding} primaryEmail={session.primaryEmail}>
      <div className="space-y-8">
        {children}
      </div>
    </OnboardingProvider>
  );
}
