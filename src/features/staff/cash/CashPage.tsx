import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock, Unlock } from 'lucide-react';
import { useAuthStore } from '@/shared/auth/store';
import { PERMISSIONS } from '@/shared/lib/permissions';
import { cashApi } from '@/shared/api/cash';
import { formatMoney } from '@/shared/lib/money';
import { formatDateTime } from '@/shared/lib/date';
import { Card, CardBody, CardHeader } from '@/shared/components/ui/Card';
import { CashAmountForm } from './CashAmountForm';
import { Badge } from '@/shared/components/ui/Badge';
import { FullPageSpinner } from '@/shared/components/ui/Spinner';
import { toastError, useToast } from '@/shared/components/ui/Toast';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { StatCard } from '@/shared/components/ui/StatCard';
import { queryKeys } from '@/shared/api/queryKeys';

export function CashPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const currentQuery = useQuery({
    queryKey: queryKeys.cash.current,
    queryFn: cashApi.current,
    retry: false,
    enabled: hasPermission(PERMISSIONS.CASH_READ),
  });

  const openMutation = useMutation({
    mutationFn: cashApi.open,
    onSuccess: () => {
      toast({ tone: 'success', title: 'Caja abierta' });
      void queryClient.invalidateQueries({ queryKey: queryKeys.cash.all });
    },
    onError: (e) => toast(toastError(e)),
  });

  const closeMutation = useMutation({
    mutationFn: cashApi.close,
    onSuccess: () => {
      toast({ tone: 'success', title: 'Caja cerrada' });
      void queryClient.invalidateQueries({ queryKey: queryKeys.cash.all });
    },
    onError: (e) => toast(toastError(e)),
  });

  if (currentQuery.isPending) return <FullPageSpinner />;

  const cashSession = currentQuery.data?.cashSession;
  const open = Boolean(cashSession);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Caja" description="Apertura y cierre de caja del día" />

      {open && cashSession ? (
        <Card>
          <CardHeader
            title="Caja abierta"
            action={<Badge tone="success">Abierta</Badge>}
            description={`Abierta el ${formatDateTime(cashSession.openedAt)}`}
          />
          <CardBody>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Fondo inicial" value={formatMoney(cashSession.openingCents)} />
              <StatCard label="Esperado en caja" value={formatMoney(currentQuery.data?.expectedCents ?? 0)} />
              <StatCard label="Declarado" value={cashSession.declaredCents != null ? formatMoney(cashSession.declaredCents) : '—'} />
            </div>

            {hasPermission(PERMISSIONS.CASH_CLOSE) && (
              <div className="mt-6 border-t border-stone-100 pt-4">
                <CloseCashForm
                  onSubmit={(declaredCents) => closeMutation.mutate({ declaredCents })}
                  loading={closeMutation.isPending}
                />
              </div>
            )}
          </CardBody>
        </Card>
      ) : hasPermission(PERMISSIONS.CASH_OPEN) ? (
        <Card>
          <CardHeader title="Abrir caja" description="Registrá el fondo con el que inicia la caja" />
          <CardBody>
            <OpenCashForm onSubmit={(openingCents) => openMutation.mutate({ openingCents })} loading={openMutation.isPending} />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody>
            <p className="text-sm text-stone-600">No hay caja abierta y no tenés permisos para abrirla.</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function OpenCashForm({ onSubmit, loading }: { onSubmit: (openingCents: number) => void; loading: boolean }) {
  return (
    <CashAmountForm
      label="Fondo inicial (USD)"
      submitLabel="Abrir caja"
      icon={<Unlock className="size-4" aria-hidden />}
      onSubmit={onSubmit}
      loading={loading}
    />
  );
}

function CloseCashForm({ onSubmit, loading }: { onSubmit: (declaredCents: number) => void; loading: boolean }) {
  return (
    <CashAmountForm
      label="Monto declarado (USD)"
      submitLabel="Cerrar caja"
      icon={<Lock className="size-4" aria-hidden />}
      variant="danger"
      onSubmit={onSubmit}
      loading={loading}
    />
  );
}
