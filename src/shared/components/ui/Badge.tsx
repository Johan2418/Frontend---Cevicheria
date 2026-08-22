import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

type Tone = 'neutral' | 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-stone-100 text-stone-700',
  brand: 'bg-brand-100 text-brand-800',
  accent: 'bg-accent-100 text-accent-800',
  success: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-sky-100 text-sky-800',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
