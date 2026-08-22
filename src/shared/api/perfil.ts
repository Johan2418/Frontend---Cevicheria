import { apiClient } from './client';
import type { Perfil } from '@/shared/types/api';

export interface CreatePerfilDto {
  nombrePerfil: string;
  apellidoPerfil: string;
  celularPerfil: string;
  fotoPerfil?: string;
}

export type UpdatePerfilDto = Partial<CreatePerfilDto>;

export const perfilApi = {
  create: (dto: CreatePerfilDto) => apiClient.post<Perfil>('/perfil', dto).then((r) => r.data),
  get: (id: number) => apiClient.get<Perfil>(`/perfil/${id}`).then((r) => r.data),
  update: (id: number, dto: UpdatePerfilDto) =>
    apiClient.patch<Perfil>(`/perfil/${id}`, dto).then((r) => r.data),
  remove: (id: number) => apiClient.delete(`/perfil/${id}`).then((r) => r.data),
};
