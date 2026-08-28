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

  /** Perfil del usuario autenticado. `null` cuando todavía no lo creó. */
  // Nest serializa un perfil inexistente como cuerpo vacío, no como `null`,
  // así que se normaliza a null para que el llamador distinga "no existe".
  getMine: () => apiClient.get<Perfil | null>('/perfil/me').then((r) => r.data || null),

  get: (id: number) => apiClient.get<Perfil>(`/perfil/${id}`).then((r) => r.data),
  update: (id: number, dto: UpdatePerfilDto) =>
    apiClient.patch<Perfil>(`/perfil/${id}`, dto).then((r) => r.data),
  remove: (id: number) => apiClient.delete(`/perfil/${id}`).then((r) => r.data),
};
