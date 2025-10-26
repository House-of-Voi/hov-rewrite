'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { refreshSession } from '@/lib/auth/client-session';
import Modal from './Modal';
import Button from './Button';

interface SessionRefreshHandlerProps {
  /** How often to check session health (minutes) */
  checkIntervalMinutes?: number;
}

/**
 * SessionRefreshHandler Component
 *
 * This component monitors session health and handles refresh failures gracefully.
 * Add it to your root layout to ensure sessions stay alive.
 *
 * Features:
 * - Periodic background session refresh
 * - Intercepts 401 responses and attempts refresh
 * - Shows modal on refresh failure instead of hard redirect
 */
export default function SessionRefreshHandler({
  checkIntervalMinutes = 30,
}: SessionRefreshHandlerProps) {
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Set up periodic session refresh
    const intervalMs = checkIntervalMinutes * 60 * 1000;

    const refreshInterval = setInterval(async () => {
      console.log('Background session refresh...');
      const success = await refreshSession();

      if (!success) {
        console.warn('Background session refresh failed');
        // Don't show modal for background failures - wait for actual 401
      }
    }, intervalMs);

    // Listen for custom session expiry events
    const handleSessionExpired = (event: Event) => {
      const customEvent = event as CustomEvent;
      const canRefresh = customEvent.detail?.canRefresh !== false;

      if (canRefresh) {
        handleRefreshAttempt();
      } else {
        setShowReauthModal(true);
      }
    };

    window.addEventListener('hov:session-expired', handleSessionExpired);

    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('hov:session-expired', handleSessionExpired);
    };
  }, [checkIntervalMinutes]);

  const handleRefreshAttempt = async () => {
    setIsRefreshing(true);

    try {
      const success = await refreshSession();

      if (success) {
        // Session refreshed successfully, reload the page
        window.location.reload();
      } else {
        // Refresh failed, show modal
        setShowReauthModal(true);
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      setShowReauthModal(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleReauth = () => {
    setShowReauthModal(false);
    // Redirect to auth page, preserving current path for return
    const currentPath = window.location.pathname;
    const returnPath = currentPath !== '/auth' ? currentPath : '/app';
    router.push(`/auth?return=${encodeURIComponent(returnPath)}`);
  };

  return (
    <>
      <Modal
        isOpen={showReauthModal}
        onClose={() => setShowReauthModal(false)}
        title="Session Expired"
      >
        <div className="space-y-4">
          <p className="text-neutral-300">
            Your session has expired. Please sign in again to continue.
          </p>

          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setShowReauthModal(false)}
              disabled={isRefreshing}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleReauth}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Refreshing...' : 'Sign In Again'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
