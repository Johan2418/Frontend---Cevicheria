import type { OrderStatus } from '@/shared/types/api';

/**
 * Statuses an order cannot move out of. Once every order a diner is watching
 * has reached one of these, there is nothing left to poll for.
 */
export const TERMINAL_ORDER_STATUSES: readonly OrderStatus[] = [
  'DELIVERED',
  'REJECTED',
  'CANCELLED',
  'EXPIRED',
];

export function isOrderTerminal(status: OrderStatus): boolean {
  return TERMINAL_ORDER_STATUSES.includes(status);
}

/**
 * Statuses that leave the happy path instead of completing it. Distinct from
 * terminal: DELIVERED is terminal but is also the successful last step, so it
 * still belongs on the progress track — these do not.
 */
export const ABORTED_ORDER_STATUSES: readonly OrderStatus[] = [
  'REJECTED',
  'CANCELLED',
  'EXPIRED',
];

export function isOrderAborted(status: OrderStatus): boolean {
  return ABORTED_ORDER_STATUSES.includes(status);
}

/** True while at least one order is still moving through the kitchen. */
export function hasLiveOrder(orders: { status: OrderStatus }[]): boolean {
  return orders.some((o) => !isOrderTerminal(o.status));
}
