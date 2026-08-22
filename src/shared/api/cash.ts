import { apiClient } from './client';
import type { CashSession } from '@/shared/types/api';

export interface OpenCashSessionDto {
  openingCents: number;
}

export interface CloseCashSessionDto {
  declaredCents: number;
}

export interface CashCurrentResponse {
  cashSession: CashSession;
  expectedCents: number;
}

export const cashApi = {
  open: (dto: OpenCashSessionDto) =>
    apiClient.post<CashSession>('/cash-sessions/open', dto).then((r) => r.data),
  current: () =>
    apiClient.get<CashCurrentResponse>('/cash-sessions/current').then((r) => r.data),
  close: (dto: CloseCashSessionDto) =>
    apiClient.post<CashSession>('/cash-sessions/close', dto).then((r) => r.data),
};
