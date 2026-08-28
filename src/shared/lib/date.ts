import { parseISO } from 'date-fns';

/**
 * The restaurant operates on a single business day boundary. All dates are
 * rendered in that timezone rather than the viewer's, so a staff member on a
 * phone set to another zone still reads the same business day as the till.
 */
export const BUSINESS_TIMEZONE = 'America/Guayaquil';

const LOCALE = 'es-EC';

/** Reads one field of a formatted date, or '' when the format omits it. */
type PartReader = (type: Intl.DateTimeFormatPartTypes) => string;

function partsOf(date: Date, options: Intl.DateTimeFormatOptions): PartReader {
  const formatter = new Intl.DateTimeFormat(LOCALE, {
    timeZone: BUSINESS_TIMEZONE,
    hourCycle: 'h23',
    ...options,
  });
  const parts = new Map<string, string>();
  for (const { type, value } of formatter.formatToParts(date)) {
    parts.set(type, value);
  }
  return (type) => parts.get(type) ?? '';
}

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
};

const TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
};

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const p = partsOf(parseISO(iso), { ...DATE_OPTIONS, ...TIME_OPTIONS });
  return `${p('day')}/${p('month')}/${p('year')} ${p('hour')}:${p('minute')}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const p = partsOf(parseISO(iso), DATE_OPTIONS);
  return `${p('day')}/${p('month')}/${p('year')}`;
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const p = partsOf(parseISO(iso), TIME_OPTIONS);
  return `${p('hour')}:${p('minute')}`;
}

/**
 * Elapsed time is a difference between instants, so it needs no timezone.
 * Only the older-than-a-day fallback renders an absolute date.
 */
export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = parseISO(iso);
  const diffMin = Math.round((Date.now() - date.getTime()) / 60000);

  if (diffMin < 1) return 'ahora';
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;

  const p = partsOf(date, { day: '2-digit', month: 'short', ...TIME_OPTIONS });
  return `${p('day')} ${p('month').replace('.', '')} ${p('hour')}:${p('minute')}`;
}

/**
 * Minutes elapsed since an instant. Used by the kitchen board to age orders.
 */
export function minutesSince(iso: string | null | undefined): number {
  if (!iso) return 0;
  return Math.max(0, Math.floor((Date.now() - parseISO(iso).getTime()) / 60000));
}
