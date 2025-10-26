'use client';

/**
 * Client-side session management utilities
 *
 * These utilities help detect and handle session issues on the client side,
 * providing a better user experience by attempting to refresh sessions
 * before forcing re-authentication.
 */

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Attempts to refresh the current session
 *
 * This function calls the /api/auth/refresh endpoint to validate
 * the CDP token and extend the session.
 *
 * @returns true if refresh successful, false otherwise
 */
export async function refreshSession(): Promise<boolean> {
  // If already refreshing, return the existing promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (response.ok && result.ok) {
        console.log('Session refreshed successfully');
        return true;
      }

      console.warn('Session refresh failed:', result.error);
      return false;
    } catch (error) {
      console.error('Session refresh error:', error);
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Retries a fetch request with session refresh fallback
 *
 * If the initial request fails with 401, this function attempts to
 * refresh the session and retry the request once.
 *
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns The fetch response
 */
export async function fetchWithSessionRefresh(
  url: string,
  options?: RequestInit
): Promise<Response> {
  // Make the initial request
  let response = await fetch(url, options);

  // If we get a 401, try refreshing the session and retry
  if (response.status === 401) {
    console.log('Got 401, attempting session refresh...');

    const refreshed = await refreshSession();

    if (refreshed) {
      console.log('Session refreshed, retrying request...');
      // Retry the original request
      response = await fetch(url, options);
    }
  }

  return response;
}

/**
 * Hook to periodically refresh the session in the background
 *
 * Call this in your root layout or app component to keep sessions alive.
 *
 * @param intervalMinutes - How often to refresh (default: 30 minutes)
 */
export function useSessionRefresh(intervalMinutes: number = 30) {
  if (typeof window === 'undefined') return;

  // Set up interval for periodic refresh
  const intervalMs = intervalMinutes * 60 * 1000;

  const intervalId = setInterval(() => {
    console.log('Periodic session refresh...');
    refreshSession().catch(err => {
      console.warn('Periodic session refresh failed:', err);
    });
  }, intervalMs);

  // Clean up on unmount
  return () => clearInterval(intervalId);
}

/**
 * Checks if we should attempt session refresh
 *
 * This can be used to detect if a session might be expiring soon
 * and proactively refresh it.
 */
export function shouldRefreshSession(): boolean {
  // For now, always allow refresh attempts
  // In the future, this could check localStorage for last refresh time, etc.
  return !isRefreshing;
}
