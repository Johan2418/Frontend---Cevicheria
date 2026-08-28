import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-stone-50 text-stone-900',
  brand: 'bg-brand-50 text-brand-900',
  success: 'bg-green-50 text-green-900',
  warning: 'bg-amber-50 text-amber-900',
  danger: 'bg-red-50 text-red-900',
};

export interface StatCardProps {
  label: string;
  value: ReactNode;
  /** Optional context under the value, e.g. "vs. ayer" or a difference. */
  hint?: string;
  tone?: Tone;
  icon?: ReactNode;
}

/**
 * A single labelled figure. Replaces the identical local `Metric` component
 * that was defined separately in DashboardPage, CashPage and ReportsPage.
 */
export function StatCard({ label, value, hint, tone = 'neutral', icon }: StatCardProps) {
  return (
    <div className={cn('rounded-lg p-4', toneClasses[tone])}>
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-sm opacity-70">{label}</p>
      </div>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs opacity-60">{hint}</p>}
    </div>
  );
}
