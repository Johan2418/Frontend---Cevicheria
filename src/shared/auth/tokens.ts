import axios from 'axios';
import { env, STORAGE_KEYS } from '@/config/env';
import type { AuthTokens } from '@/shared/types/api';

let accessToken: string | null = null;
let refreshPromise: Promise<AuthTokens> | null = null;

type AuthFailureListener = () => void;
let authFailureListener: AuthFailureListener | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.refreshToken);
}

export function setRefreshToken(token: string | null): void {
  if (token) {
    localStorage.setItem(STORAGE_KEYS.refreshToken, token);
  } else {
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
  }
}

export function setAuthFailureListener(listener: AuthFailureListener | null): void {
  authFailureListener = listener;
}

export function hasStoredSession(): boolean {
  return Boolean(getRefreshToken());
}

export function clearSession(): void {
  accessToken = null;
  setRefreshToken(null);
}

async function doRefresh(): Promise<AuthTokens> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No hay sesión activa');
  }
  const { data } = await axios.post<AuthTokens>(`${env.apiBaseUrl}/auth/refresh`, {
    refresh_token: refreshToken,
  });
  accessToken = data.access_token;
  setRefreshToken(data.refresh_token);
  return data;
}

export function refreshSession(): Promise<AuthTokens> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export function notifyAuthFailure(): void {
  clearSession();
  authFailureListener?.();
}
