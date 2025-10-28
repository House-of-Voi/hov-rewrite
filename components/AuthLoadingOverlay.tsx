'use client';

interface AuthLoadingOverlayProps {
  isLoading: boolean;
  isSuccess?: boolean;
  error?: string | null;
}

export default function AuthLoadingOverlay({ isLoading, isSuccess = false, error = null }: AuthLoadingOverlayProps) {
  if (!isLoading && !error) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md animate-fade-in">
      <div className="text-center space-y-6 px-4">
        {/* Loading State */}
        {isLoading && !error && (
          <>
            {/* Spinner */}
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 border-4 border-warning-200 dark:border-warning-900/30 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-warning-500 dark:border-t-warning-400 rounded-full animate-spin"></div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-warning-500 dark:text-warning-400">
                {isSuccess ? 'Success!' : 'Logging you in...'}
              </h2>
              {isSuccess && (
                <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                  Redirecting to your dashboard
                </p>
              )}
            </div>
          </>
        )}

        {/* Error State */}
        {error && (
          <div className="max-w-md mx-auto space-y-4">
            <div className="text-5xl">⚠️</div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-error-600 dark:text-error-400">
                Authentication Failed
              </h2>
              <p className="text-neutral-700 dark:text-neutral-300 text-sm">
                {error}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
