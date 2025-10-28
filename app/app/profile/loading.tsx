export default function Loading() {
  return (
    <div className="space-y-8 max-w-3xl mx-auto animate-pulse">
      {/* Header */}
      <div className="space-y-3">
        <div className="h-10 w-48 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
        <div className="h-5 w-96 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
      </div>

      {/* Profile form skeleton */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-8 space-y-6">
        <div className="flex items-center gap-6">
          <div className="h-32 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-full"></div>
          <div className="flex-1 space-y-4">
            <div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
            <div className="h-10 w-full bg-neutral-200 dark:bg-neutral-800 rounded"></div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
          <div className="h-10 w-full bg-neutral-200 dark:bg-neutral-800 rounded"></div>
        </div>

        <div className="space-y-4">
          <div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
          <div className="space-y-3">
            <div className="h-16 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
            <div className="h-16 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
