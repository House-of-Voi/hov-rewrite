/**
 * Loading skeleton components for games page.
 * Uses Tailwind animations for smooth loading states.
 */

export function StatsCardSkeleton() {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 animate-pulse">
      <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 rounded mb-2"></div>
      <div className="h-8 w-32 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
    </div>
  );
}

export function GameCardSkeleton() {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden animate-pulse">
      {/* Image placeholder */}
      <div className="aspect-video bg-neutral-200 dark:bg-neutral-800"></div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <div className="h-6 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
        <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-800 rounded"></div>
        <div className="h-4 w-2/3 bg-neutral-200 dark:bg-neutral-800 rounded"></div>

        {/* Button placeholder */}
        <div className="h-10 w-full bg-neutral-200 dark:bg-neutral-800 rounded-lg mt-4"></div>
      </div>
    </div>
  );
}

export function WinnersTableSkeleton() {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
      <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
        <div className="h-6 w-48 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
      </div>

      <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 flex items-center gap-4 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="h-10 w-10 bg-neutral-200 dark:bg-neutral-800 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
              <div className="h-3 w-24 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
            </div>
            <div className="h-6 w-20 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PlatformStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatsCardSkeleton />
      <StatsCardSkeleton />
      <StatsCardSkeleton />
    </div>
  );
}

export function GamesGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <GameCardSkeleton />
      <GameCardSkeleton />
      <GameCardSkeleton />
    </div>
  );
}

export function ProfileStatsSkeleton() {
  return (
    <div className="bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 rounded-xl p-6 text-white animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-5 w-32 bg-white/20 rounded"></div>
        <div className="h-8 w-8 bg-white/20 rounded-full"></div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="h-3 w-20 bg-white/20 rounded"></div>
          <div className="h-8 w-24 bg-white/20 rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="h-3 w-20 bg-white/20 rounded"></div>
          <div className="h-8 w-24 bg-white/20 rounded"></div>
        </div>
      </div>
    </div>
  );
}
