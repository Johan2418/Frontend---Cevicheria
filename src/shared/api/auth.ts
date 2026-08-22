import { apiClient } from './client';

export const authApi = {
  requestPasswordReset: (email: string) =>
    apiClient
      .post('/auth/password-reset/request', { email })
      .then((r) => r.data as { message: string }),

  confirmPasswordReset: (token: string, newPassword: string) =>
    apiClient
      .post('/auth/password-reset/confirm', { token, newPassword })
      .then((r) => r.data as { message: string }),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient
      .post('/auth/password/change', { currentPassword, newPassword })
      .then((r) => r.data as { message: string }),
};
