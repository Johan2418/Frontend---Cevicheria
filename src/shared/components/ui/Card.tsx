import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-stone-200 bg-white shadow-sm', className)}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-stone-100 px-5 py-4">
      <div>
        <h3 className="text-base font-semibold text-stone-900">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-stone-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('px-5 py-4', className)}>{children}</div>;
}
