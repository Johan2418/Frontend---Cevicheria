import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PublicTable } from '@/shared/types/api';
import { STORAGE_KEYS } from '@/config/env';
import { useCartStore } from './cartStore';

interface TableSessionState {
  table: PublicTable | null;
  token: string | null;
  expiresAt: string | null;
  setSession: (table: PublicTable, token: string, expiresAt: string) => void;
  clear: () => void;
  hasSession: () => boolean;
  pruneIfExpired: () => boolean;
}

export const useTableSessionStore = create<TableSessionState>()(
  persist(
    (set, get) => ({
      table: null,
      token: null,
      expiresAt: null,
      setSession: (table, token, expiresAt) => {
        // Cambiar de mesa empieza un pedido nuevo: arrastrar el carrito
        // anterior haría que el cliente pidiera para la mesa equivocada.
        const previous = get().table;
        if (previous && previous.idTable !== table.idTable) {
          useCartStore.getState().clear();
        }
        set({ table, token, expiresAt });
      },
      clear: () => {
        useCartStore.getState().clear();
        set({ table: null, token: null, expiresAt: null });
      },
      hasSession: () => {
        const { token, expiresAt } = get();
        if (!token || !expiresAt) return false;
        return new Date(expiresAt).getTime() > Date.now();
      },
      /**
       * Descarta una sesión de mesa vencida. El token del QR caduca en el
       * backend, así que dejarlo guardado sólo produce 401 silenciosos.
       */
      pruneIfExpired: () => {
        const { token, expiresAt } = get();
        if (!token || !expiresAt) return false;
        if (new Date(expiresAt).getTime() > Date.now()) return false;
        get().clear();
        return true;
      },
    }),
    {
      name: STORAGE_KEYS.tableSession,
      storage: {
        getItem: (name) => {
          const raw = sessionStorage.getItem(name);
          return raw ? JSON.parse(raw) : null;
        },
        setItem: (name, value) => sessionStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => sessionStorage.removeItem(name),
      },
    },
  ),
);
