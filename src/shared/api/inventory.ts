import { apiClient } from './client';
import type {
  BusinessDay,
  DailyInventory,
  InventoryMovement,
  InventoryMovementType,
} from '@/shared/types/api';

export interface OpeningInventoryItemDto {
  productId: string;
  quantity: number;
}

export interface OpenBusinessDayDto {
  inventories: OpeningInventoryItemDto[];
}

export interface CreateInventoryMovementDto {
  productId: string;
  quantity: number;
  observation: string;
}

export interface CreateConsumptionDto extends CreateInventoryMovementDto {
  consumptionKind: 'OWNER' | 'STAFF';
}

export interface CreateInventoryAdjustmentDto {
  productId: string;
  quantityDelta: number;
  observation: string;
}

export interface ListMovementsQuery {
  productId?: string;
  limit?: number;
  offset?: number;
}

const idem = (key: string) => ({ 'Idempotency-Key': key });

export const inventoryApi = {
  openBusinessDay: (dto: OpenBusinessDayDto) =>
    apiClient.post<BusinessDay>('/business-days/open', dto).then((r) => r.data),
  closeBusinessDay: () =>
    apiClient.post<BusinessDay>('/business-days/close').then((r) => r.data),
  getCurrentBusinessDay: () =>
    apiClient.get<BusinessDay>('/business-days/current').then((r) => r.data),
  getCurrentInventory: () =>
    apiClient.get<DailyInventory[]>('/business-days/current/inventory').then((r) => r.data),

  listMovements: (query?: ListMovementsQuery) =>
    apiClient
      .get<InventoryMovement[]>('/inventory/movements', { params: query })
      .then((r) => r.data),
  restock: (dto: CreateInventoryMovementDto, key: string) =>
    apiClient
      .post<InventoryMovement>('/inventory/restocks', dto, { headers: idem(key) })
      .then((r) => r.data),
  gift: (dto: CreateInventoryMovementDto, key: string) =>
    apiClient
      .post<InventoryMovement>('/inventory/gifts', dto, { headers: idem(key) })
      .then((r) => r.data),
  consumption: (dto: CreateConsumptionDto, key: string) =>
    apiClient
      .post<InventoryMovement>('/inventory/consumptions', dto, { headers: idem(key) })
      .then((r) => r.data),
  waste: (dto: CreateInventoryMovementDto, key: string) =>
    apiClient
      .post<InventoryMovement>('/inventory/waste', dto, { headers: idem(key) })
      .then((r) => r.data),
  adjustment: (dto: CreateInventoryAdjustmentDto, key: string) =>
    apiClient
      .post<InventoryMovement>('/inventory/adjustments', dto, { headers: idem(key) })
      .then((r) => r.data),
};

export const MOVEMENT_TYPE_LABEL: Record<InventoryMovementType, string> = {
  OPENING_STOCK: 'Inventario inicial',
  RESTOCK: 'Reposición',
  APP_SALE: 'Venta (app)',
  MANUAL_SALE: 'Venta (manual)',
  GIFT: 'Regalía',
  OWNER_CONSUMPTION: 'Consumo (dueño)',
  STAFF_CONSUMPTION: 'Consumo (personal)',
  WASTE: 'Desperdicio',
  POSITIVE_ADJUSTMENT: 'Ajuste (+)',
  NEGATIVE_ADJUSTMENT: 'Ajuste (−)',
  SALE_REVERSAL: 'Reversa de venta',
};
