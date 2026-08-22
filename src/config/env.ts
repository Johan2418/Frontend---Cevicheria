const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1').replace(
  /\/$/,
  '',
);

const APP_URL = (import.meta.env.VITE_APP_URL ?? 'http://localhost:5173').replace(/\/$/, '');

export const env = {
  apiBaseUrl: API_BASE_URL,
  appUrl: APP_URL,
};

export const STORAGE_KEYS = {
  refreshToken: 'cholosbar.refresh_token',
  tableSession: 'cholosbar.table_session',
  tableInfo: 'cholosbar.table_info',
} as const;
