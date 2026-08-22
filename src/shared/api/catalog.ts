import { apiClient } from './client';
import type { Category, Product } from '@/shared/types/api';

export interface CreateCategoryDto {
  name: string;
  description?: string;
  displayOrder?: number;
  active?: boolean;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  displayOrder?: number;
  active?: boolean;
}

export interface CreateProductDto {
  sku: string;
  name: string;
  description?: string;
  priceCents: number;
  imageUrl?: string;
  categoryId: string;
  active?: boolean;
  visibleInMenu?: boolean;
  trackInventory?: boolean;
  displayOrder?: number;
}

export type UpdateProductDto = Partial<CreateProductDto>;

export interface ListProductsQuery {
  categoryId?: string;
  active?: boolean;
  limit?: number;
  offset?: number;
}

export const catalogApi = {
  listCategories: () => apiClient.get<Category[]>('/categories').then((r) => r.data),
  createCategory: (dto: CreateCategoryDto) =>
    apiClient.post<Category>('/categories', dto).then((r) => r.data),
  updateCategory: (id: string, dto: UpdateCategoryDto) =>
    apiClient.patch<Category>(`/categories/${id}`, dto).then((r) => r.data),
  deleteCategory: (id: string) => apiClient.delete(`/categories/${id}`).then((r) => r.data),

  listProducts: (query?: ListProductsQuery) =>
    apiClient.get<Product[]>('/products', { params: query }).then((r) => r.data),
  createProduct: (dto: CreateProductDto) =>
    apiClient.post<Product>('/products', dto).then((r) => r.data),
  updateProduct: (id: string, dto: UpdateProductDto) =>
    apiClient.patch<Product>(`/products/${id}`, dto).then((r) => r.data),

  getMenu: () => apiClient.get<Product[]>('/menu').then((r) => r.data),
};
