export type OrderOrigin = 'APP' | 'MANUAL';

export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'DELIVERED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED';

export type InventoryEffectStatus =
  | 'RESERVED'
  | 'CONSUMED'
  | 'RELEASED'
  | 'WASTED'
  | 'NOT_TRACKED';

export type InventoryMovementType =
  | 'OPENING_STOCK'
  | 'RESTOCK'
  | 'APP_SALE'
  | 'MANUAL_SALE'
  | 'GIFT'
  | 'OWNER_CONSUMPTION'
  | 'STAFF_CONSUMPTION'
  | 'WASTE'
  | 'POSITIVE_ADJUSTMENT'
  | 'NEGATIVE_ADJUSTMENT'
  | 'SALE_REVERSAL';

export type PaymentMethod = 'CASH' | 'TRANSFER' | 'OTHER';
export type PaymentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'VOIDED';
export type BusinessDayStatus = 'OPEN' | 'CLOSED';
export type CashSessionStatus = 'OPEN' | 'CLOSED';
export type ConsumptionKind = 'OWNER' | 'STAFF';

export interface Permission {
  idPermission: number;
  codigoPermiso: string;
  nombrePermiso: string;
  descripcionPermiso: string;
}

export interface Rol {
  idRol: number;
  codigoRol: string;
  nombreRol: string;
  descripcionRol: string;
  isSystem: boolean;
  permissions?: Permission[];
}

export interface UserProfile {
  idUser: number;
  correo: string;
  idRol: number;
  codigoRol: string;
  sid: string;
  jti: string;
  /** Códigos de permiso efectivos del rol, resueltos por el backend. */
  permissions?: string[];
}

export interface Perfil {
  idPerfil: number;
  nombrePerfil: string;
  apellidoPerfil: string;
  celularPerfil: string;
  fotoPerfil?: string | null;
  estado: boolean;
}

export interface Category {
  idCategory: string;
  name: string;
  description?: string | null;
  displayOrder: number;
  active: boolean;
}

export interface Product {
  idProduct: string;
  sku: string;
  name: string;
  description?: string | null;
  priceCents: number;
  imageUrl?: string | null;
  categoryId: string;
  active: boolean;
  visibleInMenu: boolean;
  trackInventory: boolean;
  displayOrder: number;
  category?: Category;
}

export interface PublicTable {
  idTable: string;
  code: string;
  capacity: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantTable {
  idTable: string;
  code: string;
  capacity: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TableAccessExchange {
  table: PublicTable;
  tableSessionToken: string;
  expiresAt: string;
}

export interface OrderItem {
  idOrderItem: string;
  orderId: string;
  productId: string;
  productNameSnapshot: string;
  unitPriceCents: number;
  quantity: number;
  subtotalCents: number;
  observation?: string | null;
  inventoryEffectStatus: InventoryEffectStatus;
}

export interface Order {
  idOrder: string;
  businessDayId: string;
  userId?: number | null;
  createdById?: number | null;
  tableId?: string | null;
  tableSessionId?: string | null;
  origin: OrderOrigin;
  status: OrderStatus;
  totalCents: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  table?: PublicTable | null;
}

export interface OrderStatusHistory {
  idOrderStatusHistory: string;
  orderId: string;
  previousStatus?: OrderStatus | null;
  nextStatus: OrderStatus;
  actorId?: number | null;
  reason?: string | null;
  createdAt: string;
}

export interface BusinessDay {
  idBusinessDay: string;
  businessDate: string;
  status: BusinessDayStatus;
  openedById: number;
  openedAt: string;
  closedById?: number | null;
  closedAt?: string | null;
}

export interface DailyInventory {
  idDailyInventory: string;
  businessDayId: string;
  productId: string;
  initialQuantity: number;
  onHandQuantity: number;
  reservedQuantity: number;
  product: Product;
}

export interface InventoryMovement {
  idInventoryMovement: string;
  dailyInventoryId: string;
  orderId?: string | null;
  orderItemId?: string | null;
  movementType: InventoryMovementType;
  quantityDelta: number;
  balanceBefore: number;
  balanceAfter: number;
  actorId: number;
  observation: string;
  createdAt: string;
  dailyInventory?: DailyInventory;
  product?: Product;
}

export interface Payment {
  idPayment: string;
  orderId: string;
  amountCents: number;
  method: PaymentMethod;
  status: PaymentStatus;
  reference?: string | null;
  declaredById: number;
  verifiedById?: number | null;
  verifiedAt?: string | null;
  rejectedById?: number | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  voidedById?: number | null;
  voidedAt?: string | null;
  voidReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CashSession {
  idCashSession: string;
  businessDayId: string;
  status: CashSessionStatus;
  openingCents: number;
  expectedCents?: number | null;
  declaredCents?: number | null;
  differenceCents?: number | null;
  openedById: number;
  openedAt: string;
  closedById?: number | null;
  closedAt?: string | null;
}

export interface AuditEvent {
  idAuditEvent: string;
  eventCode: string;
  resourceType: string;
  resourceId?: string | null;
  actorId?: number | null;
  requestId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface CurrentBusinessReport {
  businessDayId: string;
  businessDate: string;
  sales: {
    deliveredOrderCount: number;
    totalCents: number;
    appCents: number;
    manualCents: number;
  };
  verifiedPayments: Array<{ method: PaymentMethod; amountCents: number }>;
  inventoryMovements: Array<{ movementType: InventoryMovementType; quantityDelta: number }>;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  session_id: string;
}

export interface ApiErrorBody {
  statusCode: number;
  code: string;
  message: string | string[];
  requestId?: string;
  timestamp?: string;
  path?: string;
}
