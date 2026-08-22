import { apiClient } from './client';
import type { AuditEvent } from '@/shared/types/api';

export interface ListAuditQuery {
  eventCode?: string;
  resourceType?: string;
  actorId?: number;
  limit?: number;
  offset?: number;
}

export const auditApi = {
  list: (query?: ListAuditQuery) =>
    apiClient.get<AuditEvent[]>('/audit-events', { params: query }).then((r) => r.data),
};
