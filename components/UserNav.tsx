'use client';

import { useEffect, useState, useRef, memo } from 'react';
import { useSignOut } from '@coinbase/cdp-hooks';
import Avatar from './Avatar';

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  primary_email: string;
}

interface UserNavProps {
  initialProfile?: Profile | null;
}

/**
 * User navigation component with avatar
 *
 * Displays user avatar and name in the header navigation.
 * Shows when user is authenticated.
 * Memoized to prevent unnecessary re-renders in the header.
 */
function UserNav({ initialProfile = null }: UserNavProps) {
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { signOut } = useSignOut();

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/profile/me');
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setProfile(result.data.profile);
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Listen for login success events to refresh profile
    const handleLoginSuccess = () => {
      fetchProfile();
    };

    window.addEventListener('hov:login-success', handleLoginSuccess);
    return () => window.removeEventListener('hov:login-success', handleLoginSuccess);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    try {
      // First sign out from Coinbase CDP
      await signOut();

      // Then call our backend logout endpoint to clear session
      await fetch('/api/auth/logout', { method: 'POST' });

      // Redirect to auth page
      window.location.href = '/auth';
    } catch (error) {
      console.error('Logout error:', error);
      // Still try to logout from backend even if CDP signout fails
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/auth';
    }
  };

  if (isLoading || !profile) {
    return (
      <a
        href="/auth"
        className="ml-3 px-6 py-2.5 text-sm font-black bg-gradient-to-r from-gold-500 to-gold-600 text-neutral-950 hover:from-gold-400 hover:to-gold-500 rounded-lg transition-all shadow-lg shadow-gold-950/50 tracking-wide uppercase"
      >
        Login
      </a>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-warning-50 dark:hover:bg-warning-500/10 transition-colors group"
        title="User menu"
      >
        <Avatar
          src={profile.avatar_url}
          displayName={profile.display_name}
          alt={profile.display_name || profile.primary_email}
          size="md"
        />
        <div className="hidden sm:block">
          <div className="text-sm font-bold text-warning-500 dark:text-warning-400 group-hover:text-warning-600 dark:group-hover:text-warning-300 transition-colors">
            {profile.display_name || 'User'}
          </div>
          <div className="text-xs text-neutral-500">Menu</div>
        </div>
        <svg
          className={`w-4 h-4 text-neutral-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-xl overflow-hidden z-[60]">
          <div className="py-2">
            <a
              href="/app"
              className="flex items-center gap-3 px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              onClick={() => setIsDropdownOpen(false)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Profile</span>
            </a>
            <div className="border-t border-neutral-200 dark:border-neutral-800 my-2"></div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-950 transition-colors w-full text-left"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Export memoized version to prevent unnecessary re-renders
export default memo(UserNav);
