'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Subtle loading indicator that appears in the header during route transitions.
 * Uses Tailwind-only animations for lightweight performance.
 */
export function RouteLoadingIndicator() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Start loading animation
    setIsLoading(true);
    setProgress(20);

    // Simulate progress
    const timer1 = setTimeout(() => setProgress(50), 100);
    const timer2 = setTimeout(() => setProgress(80), 300);

    // Complete after a short delay (route should be loaded by then)
    const completeTimer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 200);
    }, 500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(completeTimer);
    };
  }, [pathname]);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      {/* Subtle pulse indicator in top-right */}
      <div className="absolute top-4 right-4 flex items-center gap-2 animate-in fade-in duration-300">
        <div className="relative h-2 w-2">
          {/* Pulsing dot */}
          <div className="absolute inset-0 rounded-full bg-blue-500 animate-pulse" />
          {/* Expanding ring */}
          <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75" />
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          Loading...
        </span>
      </div>

      {/* Subtle progress bar at top */}
      <div className="h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out"
           style={{ width: `${progress}%` }} />
    </div>
  );
}
