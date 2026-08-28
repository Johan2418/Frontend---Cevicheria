import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Play, Lock } from 'lucide-react';
import { useAuthStore } from '@/shared/auth/store';
import { PERMISSIONS } from '@/shared/lib/permissions';
import { inventoryApi } from '@/shared/api/inventory';
import { catalogApi } from '@/shared/api/catalog';
import { formatMoney } from '@/shared/lib/money';
import { formatDateTime } from '@/shared/lib/date';
import { Card, CardBody, CardHeader } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Badge } from '@/shared/components/ui/Badge';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { FullPageSpinner } from '@/shared/components/ui/Spinner';
import { toastError, useToast } from '@/shared/components/ui/Toast';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { queryKeys } from '@/shared/api/queryKeys';

export function BusinessDayPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [confirmClose, setConfirmClose] = useState(false);

  const dayQuery = useQuery({
    queryKey: queryKeys.businessDay.current,
    queryFn: inventoryApi.getCurrentBusinessDay,
    retry: false,
    enabled: hasPermission(PERMISSIONS.INVENTORY_READ),
  });

  const closeMutation = useMutation({
    mutationFn: inventoryApi.closeBusinessDay,
    onSuccess: () => {
      toast({ tone: 'success', title: 'Jornada cerrada' });
      setConfirmClose(false);
      void queryClient.invalidateQueries();
    },
    onError: (e) => toast(toastError(e)),
  });

  if (dayQuery.isPending) return <FullPageSpinner />;

  const open = Boolean(dayQuery.data);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Jornada" description="Apertura y cierre del día operativo" />

      {open && dayQuery.data ? (
        <Card>
          <CardHeader
            title="Jornada abierta"
            description={`Fecha: ${dayQuery.data.businessDate}`}
            action={<Badge tone="success">Abierta</Badge>}
          />
          <CardBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-stone-50 p-4">
                <p className="text-sm text-stone-500">Abierta por usuario</p>
                <p className="font-semibold text-stone-900">#{dayQuery.data.openedById}</p>
              </div>
              <div className="rounded-lg bg-stone-50 p-4">
                <p className="text-sm text-stone-500">Inicio</p>
                <p className="font-semibold text-stone-900">{formatDateTime(dayQuery.data.openedAt)}</p>
              </div>
            </div>

            {hasPermission(PERMISSIONS.BUSINESS_DAY_CLOSE) && (
              <div className="flex justify-end">
                <Button variant="danger" onClick={() => setConfirmClose(true)}>
                  <Lock className="size-4" aria-hidden />
                  Cerrar jornada
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      ) : hasPermission(PERMISSIONS.BUSINESS_DAY_OPEN) && hasPermission(PERMISSIONS.INVENTORY_OPEN) ? (
        <OpenDayForm />
      ) : (
        <Card>
          <CardBody>
            <p className="text-sm text-stone-600">
              No hay jornada abierta y no tenés permisos para abrirla.
            </p>
          </CardBody>
        </Card>
      )}

      <ConfirmDialog
        open={confirmClose}
        onClose={() => setConfirmClose(false)}
        onConfirm={() => closeMutation.mutate()}
        title="Cerrar jornada"
        description="Al cerrar la jornada ya no se podrán registrar más ventas ni movimientos del día. Esta acción no se puede deshacer."
        confirmLabel="Cerrar jornada"
        tone="danger"
      />
    </div>
  );
}

function OpenDayForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  const productsQuery = useQuery({
    queryKey: queryKeys.products.list({ active: true, limit: 100 }),
    queryFn: () => catalogApi.listProducts({ active: true, limit: 100 }),
  });

  const openMutation = useMutation({
    mutationFn: (inventories: { productId: string; quantity: number }[]) =>
      inventoryApi.openBusinessDay({ inventories }),
    onSuccess: () => {
      toast({ tone: 'success', title: 'Jornada abierta' });
      void queryClient.invalidateQueries();
    },
    onError: (e) => toast(toastError(e)),
  });

  if (productsQuery.isPending) return <FullPageSpinner />;

  const trackedProducts = (productsQuery.data ?? []).filter((p) => p.trackInventory);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const inventories = trackedProducts.map((p) => ({
      productId: p.idProduct,
      quantity: Math.max(0, Number.parseInt(quantities[p.idProduct] ?? '0', 10) || 0),
    }));
    openMutation.mutate(inventories);
  }

  return (
    <Card>
      <CardHeader
        title="Abrir jornada"
        description="Registrá el inventario inicial de cada producto con control de inventario"
        action={<CalendarClock className="size-5 text-stone-400" aria-hidden />}
      />
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          {trackedProducts.length === 0 ? (
            <p className="text-sm text-stone-500">
              No hay productos activos con control de inventario.
            </p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {trackedProducts.map((p) => (
                <li key={p.idProduct} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-stone-900">{p.name}</p>
                    <p className="text-sm text-stone-500">{formatMoney(p.priceCents)}</p>
                  </div>
                  <div className="w-28">
                    <Input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      aria-label={`Cantidad inicial de ${p.name}`}
                      value={quantities[p.idProduct] ?? '0'}
                      onChange={(e) =>
                        setQuantities((prev) => ({ ...prev, [p.idProduct]: e.target.value }))
                      }
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}

          {trackedProducts.length > 0 && (
            <div className="flex justify-end">
              <Button type="submit" size="lg" loading={openMutation.isPending}>
                <Play className="size-4" aria-hidden />
                Abrir jornada
              </Button>
            </div>
          )}
        </form>
      </CardBody>
    </Card>
  );
}

