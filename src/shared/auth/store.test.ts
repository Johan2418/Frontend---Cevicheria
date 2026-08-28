import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from './store';
import { apiClient } from '@/shared/api/client';
import { setRefreshToken } from './tokens';
import { PERMISSIONS } from '@/shared/lib/permissions';

const tokens = { access_token: 'a', refresh_token: 'r', session_id: 's' };

const perfilBase = { idUser: 1, correo: 'a@b.c', idRol: 3, codigoRol: 'WORKER', sid: 's', jti: 'j' };

describe('useAuthStore.login', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setRefreshToken(null);
    useAuthStore.setState({ status: 'anonymous', profile: null, permissions: [] });
  });

  it('usa los permisos que envía el backend en /auth/profile', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue({ data: tokens } as never);
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { ...perfilBase, permissions: ['CASH_READ', 'REPORT_READ'] },
    } as never);

    await useAuthStore.getState().login('a@b.c', 'password1');

    expect(useAuthStore.getState().permissions).toEqual(['CASH_READ', 'REPORT_READ']);
    expect(useAuthStore.getState().hasPermission(PERMISSIONS.REPORT_READ)).toBe(true);
    // No debe caer al mapa local cuando el backend ya respondió.
    expect(useAuthStore.getState().hasPermission(PERMISSIONS.ORDER_TRANSITION)).toBe(false);
  });

  it('respeta una lista de permisos vacía en lugar de inventar los del rol', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue({ data: tokens } as never);
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { ...perfilBase, permissions: [] },
    } as never);

    await useAuthStore.getState().login('a@b.c', 'password1');

    expect(useAuthStore.getState().permissions).toEqual([]);
  });

  it('cae al mapa por rol si el backend todavía no envía permisos', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue({ data: tokens } as never);
    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: perfilBase } as never);

    await useAuthStore.getState().login('a@b.c', 'password1');

    const permissions = useAuthStore.getState().permissions;
    expect(permissions).toContain(PERMISSIONS.ORDER_TRANSITION);
    expect(permissions).not.toContain(PERMISSIONS.ROLE_MANAGE);
  });
});
