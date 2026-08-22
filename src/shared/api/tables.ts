import { apiClient } from './client';
import type { RestaurantTable, TableAccessExchange } from '@/shared/types/api';

export interface CreateTableDto {
  code: string;
  capacity: number;
  active?: boolean;
}

export interface UpdateTableDto {
  code?: string;
  capacity?: number;
  active?: boolean;
}

export interface CreateTableResponse {
  table: RestaurantTable;
  qrToken: string;
}

export const tablesApi = {
  listTables: () => apiClient.get<RestaurantTable[]>('/tables').then((r) => r.data),
  createTable: (dto: CreateTableDto) =>
    apiClient.post<CreateTableResponse>('/tables', dto).then((r) => r.data),
  updateTable: (id: string, dto: UpdateTableDto) =>
    apiClient.patch<RestaurantTable>(`/tables/${id}`, dto).then((r) => r.data),
  rotateQr: (id: string) =>
    apiClient.post<CreateTableResponse>(`/tables/${id}/qr/rotate`).then((r) => r.data),
  exchangeToken: (qrToken: string) =>
    apiClient.post<TableAccessExchange>('/table-access/exchange', { qrToken }).then((r) => r.data),
};
