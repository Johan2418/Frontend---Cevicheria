import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollText } from 'lucide-react';
import { auditApi } from '@/shared/api/audit';
import { formatDateTime } from '@/shared/lib/date';
import { Card, CardBody, CardHeader } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { Badge } from '@/shared/components/ui/Badge';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { FullPageSpinner } from '@/shared/components/ui/Spinner';

export function AuditPage() {
  const [eventCode, setEventCode] = useState('');
  const [resourceType, setResourceType] = useState('');

  const eventsQuery = useQuery({
    queryKey: ['audit', eventCode, resourceType],
    queryFn: () =>
      auditApi.list({
        limit: 100,
        eventCode: eventCode || undefined,
        resourceType: resourceType || undefined,
      }),
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Auditoría</h1>
        <p className="text-sm text-stone-500">Eventos operativos del sistema</p>
      </div>

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
