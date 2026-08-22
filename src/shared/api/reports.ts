import { apiClient } from './client';
import type { CurrentBusinessReport } from '@/shared/types/api';

export const reportsApi = {
  current: () => apiClient.get<CurrentBusinessReport>('/reports/current').then((r) => r.data),
};
