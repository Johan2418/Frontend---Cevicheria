import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ScrollText } from 'lucide-react';
import { auditApi } from '@/shared/api/audit';
import { formatDateTime } from '@/shared/lib/date';
import { Card, CardBody, CardHeader } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { Badge } from '@/shared/components/ui/Badge';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { FullPageSpinner } from '@/shared/components/ui/Spinner';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { queryKeys } from '@/shared/api/queryKeys';
import { useDebounce } from '@/shared/hooks/useDebounce';

export function AuditPage() {
  const [eventCode, setEventCode] = useState('');
  const [resourceType, setResourceType] = useState('');

  const debouncedEventCode = useDebounce(eventCode);
  const debouncedResourceType = useDebounce(resourceType);

  const eventsQuery = useQuery({
    queryKey: queryKeys.audit.list({
      eventCode: debouncedEventCode,
      resourceType: debouncedResourceType,
    }),
    queryFn: () =>
      auditApi.list({
        limit: 100,
        eventCode: debouncedEventCode || undefined,
        resourceType: debouncedResourceType || undefined,
      }),
    // Keeps the previous rows visible while the debounced filter refetches,
    // instead of flashing an empty table between keystrokes.
    placeholderData: keepPreviousData,
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Auditoría" description="Eventos operativos del sistema" />

      <Card>
        <CardHeader
          title="Filtros"
          action={<ScrollText className="size-5 text-stone-400" aria-hidden />}
        />
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Código de evento"
              placeholder="Ej: ORDER_CREATED"
              value={eventCode}
              onChange={(e) => setEventCode(e.target.value)}
            />
            <Input
              label="Tipo de recurso"
              placeholder="Ej: order"
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          {eventsQuery.isPending ? (
            <FullPageSpinner />
          ) : !eventsQuery.data || eventsQuery.data.length === 0 ? (
            <EmptyState title="Sin eventos" description="No se encontraron eventos de auditoría." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500">
                    <th scope="col" className="py-2 pr-4 font-medium">Evento</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Recurso</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Actor</th>
                    <th scope="col" className="py-2 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {eventsQuery.data.map((e) => (
                    <tr key={e.idAuditEvent}>
                      <td className="py-2.5 pr-4">
                        <Badge tone="info">{e.eventCode}</Badge>
                      </td>
                      <td className="py-2.5 pr-4 text-stone-600">
                        {e.resourceType}
                        {e.resourceId ? ` · ${e.resourceId.slice(0, 8)}` : ''}
                      </td>
                      <td className="py-2.5 pr-4 text-stone-600">
                        {e.actorId ? `#${e.actorId}` : '—'}
                      </td>
                      <td className="py-2.5 text-stone-600">{formatDateTime(e.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
