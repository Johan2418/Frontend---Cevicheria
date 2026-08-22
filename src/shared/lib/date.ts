import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export const BUSINESS_TIMEZONE = 'America/Guayaquil';

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return format(parseISO(iso), 'dd/MM/yyyy HH:mm');
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return format(parseISO(iso), 'dd/MM/yyyy');
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return format(parseISO(iso), 'HH:mm');
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = parseISO(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 1) return 'ahora';
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;
  return format(date, 'dd MMM HH:mm', { locale: es });
}
