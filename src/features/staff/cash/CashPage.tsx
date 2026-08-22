import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Unlock } from 'lucide-react';import { useAuthStore } from '@/shared/auth/store';
import { PERMISSIONS } from '@/shared/lib/permissions';
import { cashApi } from '@/shared/api/cash';
import { formatMoney } from '@/shared/lib/money';
import { formatDateTime } from '@/shared/lib/date';
import { Card, CardBody, CardHeader } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Badge } from '@/shared/components/ui/Badge';
import { FullPageSpinner } from '@/shared/components/ui/Spinner';
import { toastError, useToast } from '@/shared/components/ui/Toast';

const openSchema = z.object({
  openingCents: z.number().int().min(0, 'Debe ser 0 o más'),
});

const closeSchema = z.object({
  declaredCents: z.number().int().min(0, 'Debe ser 0 o más'),
});

export function CashPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const currentQuery = useQuery({
    queryKey: ['cash', 'current'],
    queryFn: cashApi.current,
    retry: false,
    enabled: hasPermission(PERMISSIONS.CASH_READ),
  });

  const openMutation = useMutation({
    mutationFn: cashApi.open,
    onSuccess: () => {
      toast({ tone: 'success', title: 'Caja abierta' });
      void queryClient.invalidateQueries({ queryKey: ['cash'] });
    },
    onError: (e) => toast(toastError(e)),
  });

  const closeMutation = useMutation({
    mutationFn: cashApi.close,
    onSuccess: () => {
      toast({ tone: 'success', title: 'Caja cerrada' });
      void queryClient.invalidateQueries({ queryKey: ['cash'] });
    },
    onError: (e) => toast(toastError(e)),
  });

  if (currentQuery.isPending) return <FullPageSpinner />;

  const cashSession = currentQuery.data?.cashSession;
  const open = Boolean(cashSession);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Caja</h1>
        <p className="text-sm text-stone-500">Apertura y cierre de caja del día</p>
      </div>

      {open && cashSession ? (
        <Card>
          <CardHeader
            title="Caja abierta"
            action={<Badge tone="success">Abierta</Badge>}
            description={`Abierta el ${formatDateTime(cashSession.openedAt)}`}
          />
          <CardBody>
            <div className="grid gap-4 sm:grid-cols-3">
              <Metric label="Fondo inicial" value={formatMoney(cashSession.openingCents)} />
              <Metric label="Esperado en caja" value={formatMoney(currentQuery.data?.expectedCents ?? 0)} />
              <Metric label="Declarado" value={cashSession.declaredCents != null ? formatMoney(cashSession.declaredCents) : '—'} />
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-stone-50 p-4">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-stone-900">{value}</p>
    </div>
  );
}

function OpenCashForm({ onSubmit, loading }: { onSubmit: (openingCents: number) => void; loading: boolean }) {
  const form = useForm<z.infer<typeof openSchema>>({ resolver: zodResolver(openSchema), defaultValues: { openingCents: 0 } });
  return (
    <form className="flex max-w-md items-end gap-3" onSubmit={form.handleSubmit((v) => onSubmit(v.openingCents))} noValidate>
      <div className="flex-1">
        <Input label="Fondo inicial (USD)" type="number" min={0} step="0.01" error={form.formState.errors.openingCents?.message} {...form.register('openingCents', { valueAsNumber: true })} />
      </div>
      <Button type="submit" loading={loading}>
        <Unlock className="size-4" aria-hidden /> Abrir caja
      </Button>
    </form>
  );
}

function CloseCashForm({ onSubmit, loading }: { onSubmit: (declaredCents: number) => void; loading: boolean }) {
  const form = useForm<z.infer<typeof closeSchema>>({ resolver: zodResolver(closeSchema), defaultValues: { declaredCents: 0 } });
  return (
    <form className="flex max-w-md items-end gap-3" onSubmit={form.handleSubmit((v) => onSubmit(v.declaredCents))} noValidate>
      <div className="flex-1">
        <Input label="Monto declarado (USD)" type="number" min={0} step="0.01" error={form.formState.errors.declaredCents?.message} {...form.register('declaredCents', { valueAsNumber: true })} />
      </div>
      <Button type="submit" variant="danger" loading={loading}>
        <Lock className="size-4" aria-hidden /> Cerrar caja
      </Button>
    </form>
  );
}
