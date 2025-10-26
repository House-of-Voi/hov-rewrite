'use client';

import { useEffect, useState } from 'react';
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
 */
export default function UserNav({ initialProfile = null }: UserNavProps) {
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [isLoading, setIsLoading] = useState(false);

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
    <a
      href="/app"
      className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gold-500/10 transition-colors group"
      title="View Dashboard"
    >
      <Avatar
        src={profile.avatar_url}
        displayName={profile.display_name}
        alt={profile.display_name || profile.primary_email}
        size="md"
      />
      <div className="hidden sm:block">
        <div className="text-sm font-bold text-gold-400 group-hover:text-gold-300 transition-colors">
          {profile.display_name || 'User'}
        </div>
        <div className="text-xs text-neutral-500">View Dashboard</div>
      </div>
    </a>
  );
}
