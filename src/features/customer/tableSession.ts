import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PublicTable } from '@/shared/types/api';
import { STORAGE_KEYS } from '@/config/env';

interface TableSessionState {
  table: PublicTable | null;
  token: string | null;
  expiresAt: string | null;
  setSession: (table: PublicTable, token: string, expiresAt: string) => void;
  clear: () => void;
  hasSession: () => boolean;
}

export const useTableSessionStore = create<TableSessionState>()(
  persist(
    (set, get) => ({
      table: null,
      token: null,
      expiresAt: null,
      setSession: (table, token, expiresAt) => set({ table, token, expiresAt }),
      clear: () => set({ table: null, token: null, expiresAt: null }),
      hasSession: () => {
        const { token, expiresAt } = get();
        if (!token || !expiresAt) return false;
        return new Date(expiresAt).getTime() > Date.now();
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
