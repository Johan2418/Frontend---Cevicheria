import { Clock } from 'lucide-react';
import type { OrderStatus } from '@/shared/types/api';
import { minutesSince } from '@/shared/lib/date';
import { cn } from '@/shared/lib/cn';

/**
 * Minutes a ticket has been waiting, escalating in colour as it ages. This is
 * the primary signal on a kitchen board: without it every ticket looks equally
 * urgent and the oldest order is the one that gets forgotten.
 *
 * Only live tickets escalate — a delivered order's age is history, not a queue.
 */
const LIVE: OrderStatus[] = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'];

const WARN_AFTER_MIN = 10;
const LATE_AFTER_MIN = 20;

export function OrderAge({ createdAt, status }: { createdAt: string; status: OrderStatus }) {
  const minutes = minutesSince(createdAt);
  const live = LIVE.includes(status);

  const late = live && minutes >= LATE_AFTER_MIN;
  const warn = live && !late && minutes >= WARN_AFTER_MIN;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums',
        late && 'bg-red-100 text-red-700',
        warn && 'bg-amber-100 text-amber-800',
        !late && !warn && 'text-stone-400',
      )}
      // Screen readers get the unit spelled out; sighted staff read the colour.
      aria-label={`Esperando ${minutes} minutos`}
    >
      <Clock className="size-3" aria-hidden />
      {minutes}m
    </span>
  );
}
