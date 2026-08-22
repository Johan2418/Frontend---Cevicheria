import { create } from 'zustand';
import { apiClient } from '@/shared/api/client';
import type { AuthTokens, Rol, UserProfile } from '@/shared/types/api';
import { permissionsForRole, type PermissionCode } from '@/shared/lib/permissions';
import {
  clearSession,
  getRefreshToken,
  hasStoredSession,
  refreshSession,
  setAccessToken,
  setAuthFailureListener,
} from '@/shared/auth/tokens';

interface AuthState {
  status: 'loading' | 'authenticated' | 'anonymous';
  profile: UserProfile | null;
  permissions: PermissionCode[];
  bootstrap: () => Promise<void>;
  login: (correo: string, contrasenia: string) => Promise<void>;
  register: (correo: string, contrasenia: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasPermission: (code: PermissionCode) => boolean;
}

async function resolvePermissions(codigoRol: string, idRol: number): Promise<PermissionCode[]> {
  const known = permissionsForRole(codigoRol);
  if (known) return known;
  try {
    const { data } = await apiClient.get<Rol>(`/rols/${idRol}`);
    return (data.permissions ?? []).map((p) => p.codigoPermiso as PermissionCode);
  } catch {
    return [];
  }
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  status: 'loading',
  profile: null,
  permissions: [],

  bootstrap: async () => {
    setAuthFailureListener(() => {
      set({ status: 'anonymous', profile: null, permissions: [] });
    });

    if (!hasStoredSession()) {
      set({ status: 'anonymous' });
      return;
    }
    try {
      await refreshSession();
      const { data } = await apiClient.get<UserProfile>('/auth/profile');
      const permissions = await resolvePermissions(data.codigoRol, data.idRol);
      set({ status: 'authenticated', profile: data, permissions });
    } catch {
      clearSession();
      set({ status: 'anonymous' });
    }
  },

  login: async (correo, contrasenia) => {
    const { data } = await apiClient.post<AuthTokens>('/auth/login', { correo, contrasenia });
    setAccessToken(data.access_token);
    const { data: profile } = await apiClient.get<UserProfile>('/auth/profile');
    const permissions = await resolvePermissions(profile.codigoRol, profile.idRol);
    set({ status: 'authenticated', profile, permissions });
  },

  register: async (correo, contrasenia) => {
    await apiClient.post('/auth/register', { correo, contrasenia });
  },

  logout: async () => {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refresh_token: refreshToken });
      }
    } finally {
      clearSession();
      set({ status: 'anonymous', profile: null, permissions: [] });
    }
  },

  logoutAll: async () => {
    try {
      await apiClient.post('/auth/logout-all');
    } finally {
      clearSession();
      set({ status: 'anonymous', profile: null, permissions: [] });
    }
  },

  refreshProfile: async () => {
    const { data } = await apiClient.get<UserProfile>('/auth/profile');
    const permissions = await resolvePermissions(data.codigoRol, data.idRol);
    set({ profile: data, permissions });
  },

  hasPermission: (code) => get().permissions.includes(code),
}));
