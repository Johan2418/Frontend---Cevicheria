import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Unlock } from 'lucide-react';
import { useAuthStore } from '@/shared/auth/store';
import { PERMISSIONS } from '@/shared/lib/permissions';
import { cashApi } from '@/shared/api/cash';
import { formatMoney, dollarsToCents } from '@/shared/lib/money';
import { formatDateTime } from '@/shared/lib/date';
import { Card, CardBody, CardHeader } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Badge } from '@/shared/components/ui/Badge';
import { FullPageSpinner } from '@/shared/components/ui/Spinner';
import { toastError, useToast } from '@/shared/components/ui/Toast';
import { cn } from '@/shared/lib/cn';

// Los formularios trabajan en dólares (lo que el cajero escribe) y se
// convierten a centavos enteros justo antes de llamar a la API.
const openSchema = z.object({
  openingDollars: z
    .number({ message: 'Ingresá un monto válido' })
    .min(0, 'Debe ser 0 o más')
    .max(1_000_000, 'Monto demasiado alto'),
});

const closeSchema = z.object({
  declaredDollars: z
    .number({ message: 'Ingresá un monto válido' })
    .min(0, 'Debe ser 0 o más')
    .max(1_000_000, 'Monto demasiado alto'),
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
  // `/cash-sessions/current` también devuelve la caja ya cerrada de la jornada,
  // así que el estado manda: si no está OPEN, la caja no está abierta.
  const open = cashSession?.status === 'OPEN';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Caja</h1>
        <p className="text-sm text-stone-500">Apertura y cierre de caja del día</p>
      </div>

      {cashSession && !open && (
        <Card>
          <CardHeader
            title="Caja cerrada"
            action={<Badge tone="neutral">Cerrada</Badge>}
            description={
              cashSession.closedAt
                ? `Cerrada el ${formatDateTime(cashSession.closedAt)}`
                : 'La caja de esta jornada ya fue cerrada'
            }
          />
          <CardBody>
            <div className="grid gap-4 sm:grid-cols-3">
              <Metric label="Fondo inicial" value={formatMoney(cashSession.openingCents)} />
              <Metric
                label="Esperado"
                value={cashSession.expectedCents != null ? formatMoney(cashSession.expectedCents) : '—'}
              />
              <Metric
                label="Declarado"
                value={cashSession.declaredCents != null ? formatMoney(cashSession.declaredCents) : '—'}
              />
            </div>
            {cashSession.differenceCents != null && cashSession.differenceCents !== 0 && (
              <p
                className={cn(
                  'mt-4 rounded-lg p-3 text-sm font-medium',
                  cashSession.differenceCents > 0
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'bg-red-50 text-red-800',
                )}
              >
                Diferencia de cierre: {formatMoney(cashSession.differenceCents)}
              </p>
            )}
          </CardBody>
        </Card>
      )}

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
                  onSubmit={(declaredDollars) => closeMutation.mutate({ declaredCents: dollarsToCents(declaredDollars) })}
                  loading={closeMutation.isPending}
                />
              </div>
            )}
          </CardBody>
        </Card>
      ) : !cashSession && hasPermission(PERMISSIONS.CASH_OPEN) ? (
        <Card>
          <CardHeader title="Abrir caja" description="Registrá el fondo con el que inicia la caja" />
          <CardBody>
            <OpenCashForm
              onSubmit={(openingDollars) => openMutation.mutate({ openingCents: dollarsToCents(openingDollars) })}
              loading={openMutation.isPending}
            />
          </CardBody>
        </Card>
      ) : !cashSession ? (
        <Card>
          <CardBody>
            <p className="text-sm text-stone-600">No hay caja abierta y no tenés permisos para abrirla.</p>
          </CardBody>
        </Card>
      ) : null}
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

function OpenCashForm({ onSubmit, loading }: { onSubmit: (openingDollars: number) => void; loading: boolean }) {
  const form = useForm<z.infer<typeof openSchema>>({ resolver: zodResolver(openSchema), defaultValues: { openingDollars: 0 } });
  return (
    <form className="flex max-w-md items-end gap-3" onSubmit={form.handleSubmit((v) => onSubmit(v.openingDollars))} noValidate>
      <div className="flex-1">
        <Input
          label="Fondo inicial (USD)"
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          hint="Monto en dólares, ej: 50.00"
          error={form.formState.errors.openingDollars?.message}
          {...form.register('openingDollars', { valueAsNumber: true })}
        />
      </div>
      <Button type="submit" loading={loading}>
        <Unlock className="size-4" aria-hidden /> Abrir caja
      </Button>
    </form>
  );
}

function CloseCashForm({ onSubmit, loading }: { onSubmit: (declaredDollars: number) => void; loading: boolean }) {
  const form = useForm<z.infer<typeof closeSchema>>({ resolver: zodResolver(closeSchema), defaultValues: { declaredDollars: 0 } });
  return (
    <form className="flex max-w-md items-end gap-3" onSubmit={form.handleSubmit((v) => onSubmit(v.declaredDollars))} noValidate>
      <div className="flex-1">
        <Input
          label="Monto declarado (USD)"
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          hint="Efectivo contado al cierre, en dólares"
          error={form.formState.errors.declaredDollars?.message}
          {...form.register('declaredDollars', { valueAsNumber: true })}
        />
      </div>
      <Button type="submit" variant="danger" loading={loading}>
        <Lock className="size-4" aria-hidden /> Cerrar caja
      </Button>
    </form>
  );
}
