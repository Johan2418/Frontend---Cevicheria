import type { OrderStatus } from '@/shared/types/api';
import { Badge } from './ui/Badge';

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Pendiente',
  ACCEPTED: 'Aceptado',
  PREPARING: 'Preparando',
  READY: 'Listo',
  DELIVERED: 'Entregado',
  REJECTED: 'Rechazado',
  CANCELLED: 'Cancelado',
  EXPIRED: 'Expirado',
};

const ORDER_STATUS_TONE: Record<
  OrderStatus,
  'neutral' | 'warning' | 'info' | 'brand' | 'accent' | 'success' | 'danger'
> = {
  PENDING: 'warning',
  ACCEPTED: 'info',
  PREPARING: 'brand',
  READY: 'accent',
  DELIVERED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'neutral',
  EXPIRED: 'neutral',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={ORDER_STATUS_TONE[status]}>{ORDER_STATUS_LABEL[status]}</Badge>;
}
