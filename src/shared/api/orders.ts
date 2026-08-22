import { apiClient } from './client';
import type { Order, OrderStatus, OrderStatusHistory } from '@/shared/types/api';

export interface CreateOrderItemDto {
  productId: string;
  quantity: number;
  observation?: string;
}

export interface CreateAppOrderDto {
  items: CreateOrderItemDto[];
}

export interface CreateManualOrderDto extends CreateAppOrderDto {
  tableId?: string;
}

export interface CancelOrderDto {
  reason: string;
}

export interface CancelOrderExceptionDto extends CancelOrderDto {
  resolution: 'RETURN_TO_STOCK' | 'WASTE';
}

export interface TransitionOrderDto {
  targetStatus: OrderStatus;
  reason?: string;
}

export interface ListOperationalOrdersQuery {
  status?: OrderStatus;
  limit?: number;
  offset?: number;
}

const tableSessionHeaders = (token: string) => ({ 'X-Table-Session': token });
const idempotencyHeaders = (key: string) => ({ 'Idempotency-Key': key });

export const ordersApi = {
  createAppOrder: (dto: CreateAppOrderDto, sessionToken: string, idempotencyKey: string) =>
    apiClient
      .post<Order>('/orders', dto, {
        headers: { ...tableSessionHeaders(sessionToken), ...idempotencyHeaders(idempotencyKey) },
      })
      .then((r) => r.data),

  createManualOrder: (dto: CreateManualOrderDto, idempotencyKey: string) =>
    apiClient
      .post<Order>('/orders/manual', dto, { headers: idempotencyHeaders(idempotencyKey) })
      .then((r) => r.data),

  listMine: (sessionToken: string, query?: { limit?: number; offset?: number }) =>
    apiClient
      .get<Order[]>('/orders/mine', {
        headers: tableSessionHeaders(sessionToken),
        params: query,
      })
      .then((r) => r.data),

  listOperational: (query?: ListOperationalOrdersQuery) =>
    apiClient
      .get<Order[]>('/orders/operational', { params: query })
      .then((r) => r.data),

  getHistory: (id: string) =>
    apiClient.get<OrderStatusHistory[]>(`/orders/${id}/history`).then((r) => r.data),

  transition: (id: string, dto: TransitionOrderDto) =>
    apiClient.post<Order>(`/orders/${id}/status`, dto).then((r) => r.data),

  cancel: (id: string, dto: CancelOrderDto, sessionToken: string) =>
    apiClient
      .post<Order>(`/orders/${id}/cancel`, dto, { headers: tableSessionHeaders(sessionToken) })
      .then((r) => r.data),

  cancelException: (id: string, dto: CancelOrderExceptionDto) =>
    apiClient.post<Order>(`/orders/${id}/cancel-exception`, dto).then((r) => r.data),
};
