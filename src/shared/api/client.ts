import axios, { AxiosError } from 'axios';
import { env } from '@/config/env';
import type { ApiErrorBody } from '@/shared/types/api';
import { getAccessToken, refreshSession, notifyAuthFailure } from '@/shared/auth/tokens';

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config;
    const status = error.response?.status;

    if (
      status === 401 &&
      original &&
      !original.url?.includes('/auth/login') &&
      !original.url?.includes('/auth/refresh') &&
      !original.url?.includes('/auth/register') &&
      !(original as { _retried?: boolean })._retried
    ) {
      (original as { _retried?: boolean })._retried = true;
      try {
        await refreshSession();
        return apiClient(original);
      } catch {
        notifyAuthFailure();
      }
    }

    return Promise.reject(normalizeError(error));
  },
);

export function normalizeError(error: unknown): ApiError {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const body = error.response?.data;
    const message = body?.message
      ? Array.isArray(body.message)
        ? body.message.join('. ')
        : body.message
      : error.message;
    return {
      status: error.response?.status ?? 0,
      code: body?.code ?? 'NETWORK_ERROR',
      message,
      requestId: body?.requestId,
      isNetworkError: !error.response,
    };
  }
  return {
    status: 0,
    code: 'UNKNOWN_ERROR',
    message: error instanceof Error ? error.message : 'Error inesperado',
    isNetworkError: true,
  };
}

export interface ApiError {
  status: number;
  code: string;
  message: string;
  requestId?: string;
  isNetworkError: boolean;
}
