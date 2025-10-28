import {
  PlatformStatsSkeleton,
  GamesGridSkeleton,
} from '@/components/GamesSkeleton';

export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="text-center space-y-3 animate-pulse">
        <div className="h-12 w-96 bg-neutral-200 dark:bg-neutral-800 rounded mx-auto"></div>
        <div className="h-6 w-64 bg-neutral-200 dark:bg-neutral-800 rounded mx-auto"></div>
      </div>

      {/* Platform stats skeleton */}
      <PlatformStatsSkeleton />

      {/* Games grid skeleton */}
      <GamesGridSkeleton />
    </div>
  );
}
