import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('size-5 animate-spin text-brand-600', className)} aria-hidden />;
}

export function FullPageSpinner({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3" role="status">
      <Spinner className="size-8" />
      <span className="text-sm text-stone-500">{label}</span>
    </div>
  );
}
