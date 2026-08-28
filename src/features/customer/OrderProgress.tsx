import { Check } from 'lucide-react';
import type { OrderStatus } from '@/shared/types/api';
import { cn } from '@/shared/lib/cn';
import { isOrderAborted } from '@/shared/lib/orderStatus';

/** The happy path a diner's order walks through, in order. */
const STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'PENDING', label: 'Recibido' },
  { status: 'ACCEPTED', label: 'Aceptado' },
  { status: 'PREPARING', label: 'En cocina' },
  { status: 'READY', label: 'Listo' },
  { status: 'DELIVERED', label: 'Entregado' },
];

/**
 * Turns the polled status into visible progress. Without it the diner sees a
 * badge change wording every few minutes and cannot tell how far along they are
 * or how much is left.
 */
export function OrderProgress({ status }: { status: OrderStatus }) {
  if (isOrderAborted(status)) return null;

  const currentIndex = STEPS.findIndex((s) => s.status === status);
  if (currentIndex === -1) return null;

  return (
    <ol className="mt-3 flex items-center gap-1" aria-label="Estado del pedido">
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;

        return (
          <li key={step.status} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full items-center">
              {/* Connector to the previous step, so the row reads as one track. */}
              <span
                className={cn(
                  'h-0.5 flex-1 rounded-full',
                  i === 0 ? 'bg-transparent' : done || current ? 'bg-brand-600' : 'bg-stone-200',
                )}
                aria-hidden
              />
              <span
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  done && 'border-brand-600 bg-brand-600 text-white',
                  current && 'border-brand-600 bg-white',
                  !done && !current && 'border-stone-200 bg-white',
                )}
                aria-hidden
              >
                {done ? (
                  <Check className="size-3" strokeWidth={3} />
                ) : current ? (
                  <span className="size-2 rounded-full bg-brand-600" />
                ) : null}
              </span>
              <span
                className={cn(
                  'h-0.5 flex-1 rounded-full',
                  i === STEPS.length - 1 ? 'bg-transparent' : done ? 'bg-brand-600' : 'bg-stone-200',
                )}
                aria-hidden
              />
            </div>
            <span
              className={cn(
                'text-center text-[11px] leading-tight',
                current ? 'font-semibold text-brand-800' : 'text-stone-400',
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
