'use client';

import { useEffect } from 'react';
import Button from '@/components/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Games error:', error);
  }, [error]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl md:text-5xl font-semibold text-neutral-950 dark:text-white">
          Browse Games
        </h1>
        <p className="text-neutral-700 dark:text-neutral-300 text-lg">
          Pick your favorite and start playing
        </p>
      </div>

      {/* Error message */}
      <div className="max-w-2xl mx-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-8 text-center space-y-6 animate-in fade-in duration-500">
        <div className="w-16 h-16 bg-error-100 dark:bg-error-900/30 rounded-full flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 text-error-600 dark:text-error-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-neutral-950 dark:text-white">
            Failed to load games
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400">
            We couldn&apos;t fetch the games list. Please try again.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="primary" size="md" onClick={reset}>
            Retry
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={() => (window.location.href = '/')}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
