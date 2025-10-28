'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * PageTransition wrapper provides smooth fade-in animations when pages change.
 * Uses Tailwind's built-in animation utilities for lightweight transitions.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Reset visibility on route change
    setIsVisible(false);

    // Trigger fade-in after a brief delay to ensure DOM is ready
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div
      className={`transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {children}
    </div>
  );
}

/**
 * SlideUpTransition provides a slide-up + fade effect
 * Use for sections that should "rise" into view
 */
export function SlideUpTransition({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-4 duration-500"
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/**
 * StaggeredList provides staggered animations for list items
 * Each child will animate in sequence
 */
export function StaggeredList({
  children,
  staggerDelay = 100,
}: {
  children: React.ReactNode;
  staggerDelay?: number;
}) {
  const childArray = Array.isArray(children) ? children : [children];

  return (
    <>
      {childArray.map((child, index) => (
        <div
          key={index}
          className="animate-in fade-in slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: `${index * staggerDelay}ms` }}
        >
          {child}
        </div>
      ))}
    </>
  );
}
