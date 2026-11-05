export function PageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <div className="bg-surface-2 h-4 w-32 animate-pulse rounded" />
      <div className="bg-surface-2 h-9 w-56 animate-pulse rounded-lg" />
      <div className="bg-surface-2 h-40 animate-pulse rounded-2xl" />
      <div className="bg-surface-2 h-24 animate-pulse rounded-2xl" />
    </div>
  );
}
