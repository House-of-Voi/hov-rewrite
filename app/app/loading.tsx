export default function Loading() {
  return (
    <div className="space-y-8 max-w-4xl animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-4">
        <div className="h-10 w-64 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
        <div className="h-5 w-96 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
      </div>

      {/* Profile card skeleton */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-8">
        <div className="flex items-start gap-6">
          <div className="h-24 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-full"></div>
          <div className="flex-1 space-y-4">
            <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
            <div className="h-4 w-64 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
            <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
          </div>
        </div>
      </div>

      {/* Content grid skeleton */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 h-64"></div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 h-64"></div>
      </div>
    </div>
  );
}
