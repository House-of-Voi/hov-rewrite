'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { validateAndAttributeReferral } from './actions';
import type { ReferralValidationResult } from '@/lib/referrals/validation';

export const dynamic = 'force-dynamic';

export default function ReferralPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const [validation, setValidation] = useState<ReferralValidationResult | null>(
    null
  );
  const [code, setCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const resolvedParams = await params;
        const normalizedCode = resolvedParams.code.toUpperCase();
        setCode(normalizedCode);

        // Validate referral code and update database
        const result = await validateAndAttributeReferral(normalizedCode);
        setValidation(result);

        // Set cookie in browser (httpOnly: false allows JS access)
        document.cookie = `hov_ref=${normalizedCode}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
      } catch (error) {
        console.error('Error loading referral:', error);
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, [params]);

  if (isLoading || !validation) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 py-8">
        <div className="text-center space-y-4">
          <div className="inline-block px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full">
            <span className="text-white font-semibold">Loading...</span>
          </div>
          <h1 className="text-4xl font-bold">Join House of Voi</h1>
          <p className="text-lg text-neutral-700 dark:text-neutral-300">
            Validating your referral code...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8">
      {/* Referral Header */}
      <div className="text-center space-y-4">
        <div className="inline-block px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full">
          <span className="text-white font-semibold">
            🎉 You&apos;ve Been Invited!
          </span>
        </div>
        <h1 className="text-4xl font-bold">Join House of Voi</h1>
        <p className="text-lg text-neutral-700 dark:text-neutral-300">
          You&apos;ve been referred by{' '}
          <span className="font-bold text-purple-600 dark:text-purple-400">
            {validation.referrerName}
          </span>
        </p>
        <p className="text-sm text-neutral-500">
          Code:{' '}
          <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
            {code}
          </span>
        </p>
        {validation.atCapacity && (
          <div className="inline-block px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⏳ This referrer is at capacity. You&apos;ll be added to their
              waitlist and activated when a slot opens.
            </p>
          </div>
        )}
      </div>

      {/* Benefits Section */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 space-y-6">
        <h2 className="text-2xl font-bold text-center">What You&apos;ll Get</h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center space-y-2">
            <div className="text-4xl">🔗</div>
            <h3 className="font-semibold">Multi-Chain Access</h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              Connect wallets from Base, Voi, and Solana
            </p>
          </div>

          <div className="text-center space-y-2">
            <div className="text-4xl">💰</div>
            <h3 className="font-semibold">Earn Rewards</h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              Get rewards for joining and referring others
            </p>
          </div>

          <div className="text-center space-y-2">
            <div className="text-4xl">🌟</div>
            <h3 className="font-semibold">Early Access</h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              Be among the first in the community
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center text-white space-y-6">
        <h2 className="text-2xl font-bold">Ready to Get Started?</h2>
        <p className="text-lg opacity-90">
          Your referral code has been saved. Create your account now to unlock all features.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/auth"
            className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg font-bold hover:bg-opacity-90 transition-all"
          >
            Create Account
          </Link>
          <Link
            href="/"
            className="inline-block px-8 py-4 border-2 border-white text-white rounded-lg font-bold hover:bg-white hover:text-blue-600 transition-all"
          >
            Learn More
          </Link>
        </div>
      </div>

      {/* Referrer Info */}
      <div className="text-center text-sm text-neutral-500">
        <p>Referred by {validation.referrerName}</p>
        <p className="mt-2">Your referral code will be saved for 30 days</p>
      </div>
    </div>
  );
}
