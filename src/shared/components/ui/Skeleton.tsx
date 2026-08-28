import { cn } from '@/shared/lib/cn';

export interface SkeletonProps {
  className?: string;
}

/**
 * A placeholder block matching the shape of the content that is loading.
 * Preferred over FullPageSpinner, which blanks the screen on every refetch.
 * The animation is suppressed by the prefers-reduced-motion rule in styles.css.
 */
export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-md bg-stone-200', className)} aria-hidden />;
}

/** Repeats a skeleton row, for lists and tables of unknown length. */
export function SkeletonList({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className="space-y-3" role="status" aria-label="Cargando">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className={cn('h-16 w-full', className)} />
      ))}
    </div>
  );
}
