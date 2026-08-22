import { apiClient } from './client';
import type { Payment, PaymentMethod } from '@/shared/types/api';

export interface CreatePaymentDto {
  orderId: string;
  method: PaymentMethod;
  reference?: string;
}

export interface PaymentReasonDto {
  reason: string;
}

export const paymentsApi = {
  create: (dto: CreatePaymentDto) =>
    apiClient.post<Payment>('/payments', dto).then((r) => r.data),
  getForOrder: (orderId: string) =>
    apiClient.get<Payment>(`/payments/order/${orderId}`).then((r) => r.data),
  verify: (id: string) => apiClient.post<Payment>(`/payments/${id}/verify`).then((r) => r.data),
  reject: (id: string, dto: PaymentReasonDto) =>
    apiClient.post<Payment>(`/payments/${id}/reject`, dto).then((r) => r.data),
  void: (id: string, dto: PaymentReasonDto) =>
    apiClient.post<Payment>(`/payments/${id}/void`, dto).then((r) => r.data),
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  TRANSFER: 'Transferencia',
  OTHER: 'Otro',
};
