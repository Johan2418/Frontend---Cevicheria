/**
 * Single source of truth for React Query cache keys.
 *
 * These used to be inline string arrays spread across the pages, where a typo
 * silently broke invalidation instead of failing loudly. Prefer the narrow
 * helpers when reading, and the broad `all` key when invalidating a whole area.
 */
export const queryKeys = {
  menu: ['menu'] as const,

  products: {
    all: ['products'] as const,
  },

  categories: {
    all: ['categories'] as const,
  },

  tables: {
    all: ['tables'] as const,
  },

  orders: {
    all: ['orders'] as const,
    operational: ['orders', 'operational'] as const,
    mine: ['orders', 'mine'] as const,
    history: (orderId: string) => ['orders', orderId, 'history'] as const,
  },

  payments: {
    all: ['payments'] as const,
    byOrder: (orderId: string) => ['payments', 'order', orderId] as const,
  },

  cash: {
    all: ['cash'] as const,
    current: ['cash', 'current'] as const,
  },

  businessDay: {
    all: ['business-day'] as const,
    current: ['business-day', 'current'] as const,
  },

  inventory: {
    all: ['inventory'] as const,
    current: ['inventory', 'current'] as const,
    movements: ['inventory', 'movements'] as const,
  },

  reports: {
    all: ['report'] as const,
    current: ['report', 'current'] as const,
  },

  audit: {
    all: ['audit'] as const,
    list: (filters: { eventCode?: string; resourceType?: string }) =>
      ['audit', filters] as const,
  },

  roles: {
    all: ['rols'] as const,
  },

  perfil: {
    byUser: (userId: number | undefined) => ['perfil', userId] as const,
  },
} as const;
