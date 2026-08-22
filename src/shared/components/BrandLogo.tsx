import { cn } from '@/shared/lib/cn';

export function BrandLogo({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className={cn(
          'flex size-10 items-center justify-center rounded-xl font-display text-xl',
          light ? 'bg-white/15 text-white' : 'bg-brand-700 text-white',
        )}
        aria-hidden
      >
        C
      </span>
      {!compact && (
        <span className={cn('font-display text-2xl tracking-wide', light ? 'text-white' : 'text-brand-800')}>
          CholosBar
        </span>
      )}
    </span>
  );
}
