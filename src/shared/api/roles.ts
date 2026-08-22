import { apiClient } from './client';
import type { Rol } from '@/shared/types/api';

export interface CreateRolDto {
  codigoRol: string;
  nombreRol: string;
  descripcionRol: string;
}

export interface UpdateRolDto {
  codigoRol?: string;
  nombreRol?: string;
  descripcionRol?: string;
}

export interface ReplacePermissionsDto {
  permissionCodes: string[];
}

export const rolesApi = {
  list: () => apiClient.get<Rol[]>('/rols').then((r) => r.data),
  get: (id: number) => apiClient.get<Rol>(`/rols/${id}`).then((r) => r.data),
  create: (dto: CreateRolDto) => apiClient.post<Rol>('/rols', dto).then((r) => r.data),
  update: (id: number, dto: UpdateRolDto) =>
    apiClient.patch<Rol>(`/rols/${id}`, dto).then((r) => r.data),
  replacePermissions: (id: number, permissionCodes: string[]) =>
    apiClient
      .put<Rol>(`/rols/${id}/permissions`, { permissionCodes })
      .then((r) => r.data),
  remove: (id: number) => apiClient.delete(`/rols/${id}`).then((r) => r.data),
};
