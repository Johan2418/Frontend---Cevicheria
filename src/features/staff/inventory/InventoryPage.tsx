import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Package,
  Gift,
  Utensils,
  Trash2,
  SlidersHorizontal,
  PackagePlus,
} from 'lucide-react';
import { useAuthStore } from '@/shared/auth/store';
import { PERMISSIONS, type PermissionCode } from '@/shared/lib/permissions';
import {
  inventoryApi,
  MOVEMENT_TYPE_LABEL,
  type CreateInventoryMovementDto,
} from '@/shared/api/inventory';
import { newIdempotencyKey } from '@/shared/lib/idempotency';
import { formatQuantity, formatDelta } from '@/shared/lib/money';
import { formatDateTime } from '@/shared/lib/date';
import { Card, CardBody, CardHeader } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Modal } from '@/shared/components/ui/Modal';
import { Select } from '@/shared/components/ui/Select';
import { Input } from '@/shared/components/ui/Input';
import { Textarea } from '@/shared/components/ui/Textarea';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { FullPageSpinner } from '@/shared/components/ui/Spinner';
import { Badge } from '@/shared/components/ui/Badge';
import { toastError, useToast } from '@/shared/components/ui/Toast';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { queryKeys } from '@/shared/api/queryKeys';

type MovementKind = 'RESTOCK' | 'GIFT' | 'CONSUMPTION' | 'WASTE' | 'ADJUST';

const KIND_LABEL: Record<MovementKind, string> = {
  RESTOCK: 'Reposición',
  GIFT: 'Regalía',
  CONSUMPTION: 'Consumo',
  WASTE: 'Desperdicio',
  ADJUST: 'Ajuste',
};

const KIND_PERMISSION: Record<MovementKind, PermissionCode> = {
  RESTOCK: PERMISSIONS.INVENTORY_RESTOCK,
  GIFT: PERMISSIONS.INVENTORY_GIFT,
  CONSUMPTION: PERMISSIONS.INVENTORY_CONSUMPTION,
  WASTE: PERMISSIONS.INVENTORY_WASTE,
  ADJUST: PERMISSIONS.INVENTORY_ADJUST,
};

export function InventoryPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [activeKind, setActiveKind] = useState<MovementKind | null>(null);

  const inventoryQuery = useQuery({
    queryKey: queryKeys.inventory.current,
    queryFn: inventoryApi.getCurrentInventory,
  });

  const movementsQuery = useQuery({
    queryKey: queryKeys.inventory.movements,
    queryFn: () => inventoryApi.listMovements({ limit: 50 }),
  });

  if (inventoryQuery.isPending) return <FullPageSpinner />;

  const availableKinds = (Object.keys(KIND_LABEL) as MovementKind[]).filter((k) =>
    hasPermission(KIND_PERMISSION[k]),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader title="Inventario" description="Existencias y movimientos del día" />
        <div className="flex flex-wrap gap-2">
          {availableKinds.map((k) => (
            <Button key={k} variant="outline" size="sm" onClick={() => setActiveKind(k)}>
              {kindIcon(k)}
              {KIND_LABEL[k]}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader title="Existencias actuales" description="Disponible = en mano − reservado" />
        <CardBody>
          {!inventoryQuery.data || inventoryQuery.data.length === 0 ? (
            <EmptyState
              icon={<Package className="size-10" aria-hidden />}
              title="Sin inventario"
              description="Abrí la jornada para registrar el inventario inicial."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500">
                    <th scope="col" className="py-2 pr-4 font-medium">Producto</th>
                    <th scope="col" className="py-2 pr-4 text-right font-medium">En mano</th>
                    <th scope="col" className="py-2 pr-4 text-right font-medium">Reservado</th>
                    <th scope="col" className="py-2 text-right font-medium">Disponible</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {inventoryQuery.data.map((inv) => (
                    <tr key={inv.idDailyInventory}>
                      <td className="py-2.5 pr-4">
                        <span className="font-medium text-stone-900">{inv.product.name}</span>
                      </td>
                      <td className="py-2.5 pr-4 text-right">{formatQuantity(inv.onHandQuantity)}</td>
                      <td className="py-2.5 pr-4 text-right text-stone-500">
                        {formatQuantity(inv.reservedQuantity)}
                      </td>
                      <td className="py-2.5 text-right font-semibold">
                        {formatQuantity(inv.onHandQuantity - inv.reservedQuantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Movimientos" description="Últimos movimientos registrados" />
        <CardBody>
          {!movementsQuery.data || movementsQuery.data.length === 0 ? (
            <EmptyState title="Sin movimientos" />
          ) : (
            <ul className="divide-y divide-stone-100">
              {movementsQuery.data.map((m) => (
                <li key={m.idInventoryMovement} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-stone-900">{m.product?.name ?? m.dailyInventory?.product.name}</p>
                    <p className="text-xs text-stone-500">
                      {MOVEMENT_TYPE_LABEL[m.movementType]} · {formatDateTime(m.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge tone={m.quantityDelta > 0 ? 'success' : 'danger'}>
                      {formatDelta(m.quantityDelta)}
                    </Badge>
                    <p className="mt-0.5 text-xs text-stone-500">Saldo: {formatQuantity(m.balanceAfter)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {activeKind && (
        <MovementFormModal
          kind={activeKind}
          products={inventoryQuery.data ?? []}
          onClose={() => setActiveKind(null)}
        />
      )}
    </div>
  );
}

function kindIcon(kind: MovementKind) {
  switch (kind) {
    case 'RESTOCK':
      return <PackagePlus className="size-4" aria-hidden />;
    case 'GIFT':
      return <Gift className="size-4" aria-hidden />;
    case 'CONSUMPTION':
      return <Utensils className="size-4" aria-hidden />;
    case 'WASTE':
      return <Trash2 className="size-4" aria-hidden />;
    case 'ADJUST':
      return <SlidersHorizontal className="size-4" aria-hidden />;
  }
}

const baseSchema = z.object({
  productId: z.string().min(1, 'Seleccioná un producto'),
  quantity: z.number().int().min(1, 'Mínimo 1'),
  observation: z.string().min(3, 'Mínimo 3 caracteres').max(500),
});

const adjustSchema = z.object({
  productId: z.string().min(1, 'Seleccioná un producto'),
  quantityDelta: z.number().int().refine((v) => v !== 0, 'Debe ser distinto de 0'),
  observation: z.string().min(3, 'Mínimo 3 caracteres').max(500),
});

type BaseValues = z.infer<typeof baseSchema>;
type AdjustValues = z.infer<typeof adjustSchema>;

function MovementFormModal({
  kind,
  products,
  onClose,
}: {
  kind: MovementKind;
  products: { productId: string; product: { name: string } }[];
  onClose: () => void;
}) {
  if (kind === 'ADJUST') {
    return <AdjustMovementForm products={products} onClose={onClose} />;
  }
  return <StandardMovementForm kind={kind} products={products} onClose={onClose} />;
}

function StandardMovementForm({
  kind,
  products,
  onClose,
}: {
  kind: Exclude<MovementKind, 'ADJUST'>;
  products: { productId: string; product: { name: string } }[];
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [consumptionKind, setConsumptionKind] = useState<'OWNER' | 'STAFF'>('OWNER');

  const form = useForm<BaseValues>({
    resolver: zodResolver(baseSchema),
    defaultValues: { productId: '', quantity: 1, observation: '' },
  });

  const mutation = useMutation({
    mutationFn: (v: BaseValues) => {
      const key = newIdempotencyKey();
      const dto: CreateInventoryMovementDto = {
        productId: v.productId,
        quantity: v.quantity,
        observation: v.observation,
      };
      switch (kind) {
        case 'RESTOCK':
          return inventoryApi.restock(dto, key);
        case 'GIFT':
          return inventoryApi.gift(dto, key);
        case 'WASTE':
          return inventoryApi.waste(dto, key);
        case 'CONSUMPTION':
          return inventoryApi.consumption({ ...dto, consumptionKind }, key);
      }
    },
    onSuccess: () => {
      toast({ tone: 'success', title: `${KIND_LABEL[kind]} registrado` });
      onClose();
      void queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
    },
    onError: (e) => toast(toastError(e)),
  });

  const onSubmit = form.handleSubmit((v) => mutation.mutate(v));

  return (
    <Modal
      open
      onClose={onClose}
      title={`Registrar ${KIND_LABEL[kind].toLowerCase()}`}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onSubmit} loading={mutation.isPending}>Guardar</Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {products.length === 0 && (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            No hay jornada abierta o no hay productos con inventario. Abrí la jornada para registrar movimientos.
          </p>
        )}
        <Select label="Producto" placeholder="Seleccioná un producto" error={form.formState.errors.productId?.message} {...form.register('productId')}>
          {products.map((inv) => (
            <option key={inv.productId} value={inv.productId}>
              {inv.product.name}
            </option>
          ))}
        </Select>

        {kind === 'CONSUMPTION' && (
          <Select label="Tipo de consumo" value={consumptionKind} onChange={(e) => setConsumptionKind(e.target.value as 'OWNER' | 'STAFF')}>
            <option value="OWNER">Dueño</option>
            <option value="STAFF">Personal</option>
          </Select>
        )}

        <Input
          label="Cantidad"
          type="number"
          min={1}
          inputMode="numeric"
          error={form.formState.errors.quantity?.message}
          {...form.register('quantity', { valueAsNumber: true })}
        />

        <Textarea
          label="Observación"
          rows={3}
          placeholder="Detalle del movimiento"
          error={form.formState.errors.observation?.message}
          {...form.register('observation')}
        />
      </form>
    </Modal>
  );
}

function AdjustMovementForm({
  products,
  onClose,
}: {
  products: { productId: string; product: { name: string } }[];
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AdjustValues>({
    resolver: zodResolver(adjustSchema),
    defaultValues: { productId: '', quantityDelta: 0, observation: '' },
  });

  const mutation = useMutation({
    mutationFn: (v: AdjustValues) =>
      inventoryApi.adjustment(
        { productId: v.productId, quantityDelta: v.quantityDelta, observation: v.observation },
        newIdempotencyKey(),
      ),
    onSuccess: () => {
      toast({ tone: 'success', title: 'Ajuste registrado' });
      onClose();
      void queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
    },
    onError: (e) => toast(toastError(e)),
  });

  const onSubmit = form.handleSubmit((v) => mutation.mutate(v));

  return (
    <Modal
      open
      onClose={onClose}
      title="Registrar ajuste"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onSubmit} loading={mutation.isPending}>Guardar</Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {products.length === 0 && (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            No hay jornada abierta o no hay productos con inventario. Abrí la jornada para registrar movimientos.
          </p>
        )}
        <Select label="Producto" placeholder="Seleccioná un producto" error={form.formState.errors.productId?.message} {...form.register('productId')}>
          {products.map((inv) => (
            <option key={inv.productId} value={inv.productId}>
              {inv.product.name}
            </option>
          ))}
        </Select>

        <Input
          label="Ajuste (±)"
          type="number"
          hint="Positivo para sumar, negativo para restar"
          error={form.formState.errors.quantityDelta?.message}
          {...form.register('quantityDelta', { valueAsNumber: true })}
        />

        <Textarea
          label="Observación"
          rows={3}
          placeholder="Detalle del movimiento"
          error={form.formState.errors.observation?.message}
          {...form.register('observation')}
        />
      </form>
    </Modal>
  );
}
