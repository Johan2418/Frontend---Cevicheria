import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Pencil, QrCode, Table2, Printer } from 'lucide-react';
import { useAuthStore } from '@/shared/auth/store';
import { PERMISSIONS } from '@/shared/lib/permissions';
import { tablesApi, type CreateTableDto } from '@/shared/api/tables';
import type { RestaurantTable } from '@/shared/types/api';
import { env } from '@/config/env';
import { Card, CardBody } from '@/shared/components/ui/Card';
import { FormCheckbox } from '@/shared/components/ui/Checkbox';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Modal } from '@/shared/components/ui/Modal';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { Badge } from '@/shared/components/ui/Badge';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { FullPageSpinner } from '@/shared/components/ui/Spinner';
import { toastError, useToast } from '@/shared/components/ui/Toast';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { queryKeys } from '@/shared/api/queryKeys';

const tableSchema = z.object({
  code: z.string().min(1, 'Requerido').max(50).regex(/^[A-Z0-9][A-Z0-9_-]*$/, 'Solo mayúsculas, números, guion'),
  capacity: z.number().int().min(1, 'Mínimo 1').max(100),
  active: z.boolean(),
});

export function TablesPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canManage = hasPermission(PERMISSIONS.TABLE_MANAGE);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<RestaurantTable | null>(null);
  const [qr, setQr] = useState<{ table: RestaurantTable; qrToken: string } | null>(null);
  const [rotating, setRotating] = useState<RestaurantTable | null>(null);

  const tablesQuery = useQuery({ queryKey: queryKeys.tables.all, queryFn: tablesApi.listTables });

  const createMutation = useMutation({
    mutationFn: (dto: CreateTableDto) => tablesApi.createTable(dto),
    onSuccess: (res) => {
      toast({ tone: 'success', title: 'Mesa creada' });
      setCreating(false);
      setQr({ table: res.table, qrToken: res.qrToken });
      void queryClient.invalidateQueries({ queryKey: queryKeys.tables.all });
    },
    onError: (e) => toast(toastError(e)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CreateTableDto }) => tablesApi.updateTable(id, dto),
    onSuccess: () => {
      toast({ tone: 'success', title: 'Mesa actualizada' });
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: queryKeys.tables.all });
    },
    onError: (e) => toast(toastError(e)),
  });

  const rotateMutation = useMutation({
    mutationFn: (id: string) => tablesApi.rotateQr(id),
    onSuccess: (res) => {
      setRotating(null);
      setQr({ table: res.table, qrToken: res.qrToken });
    },
    onError: (e) => toast(toastError(e)),
  });

  if (tablesQuery.isPending) return <FullPageSpinner />;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Mesas" description="Gestioná las mesas y sus códigos QR" />
        {canManage && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" aria-hidden /> Nueva mesa
          </Button>
        )}
      </div>

      <Card>
        <CardBody>
          {!tablesQuery.data || tablesQuery.data.length === 0 ? (
            <EmptyState
              icon={<Table2 className="size-10" aria-hidden />}
              title="Sin mesas"
              description="Creá mesas para que los clientes puedan pedir desde el QR."
            />
          ) : (
            <ul className="divide-y divide-stone-100">
              {tablesQuery.data.map((t) => (
                <li key={t.idTable} className="flex items-center gap-3 py-3">
                  <div className="flex size-11 items-center justify-center rounded-lg bg-brand-100 font-display text-lg text-brand-800">
                    {t.code}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-stone-900">Mesa {t.code}</p>
                    <p className="text-xs text-stone-500">Capacidad: {t.capacity} personas</p>
                  </div>
                  {!t.active && <Badge tone="neutral">Inactiva</Badge>}
                  {hasPermission(PERMISSIONS.TABLE_QR_ROTATE) && (
                    <Button variant="outline" size="sm" onClick={() => setRotating(t)}>
                      <QrCode className="size-4" aria-hidden /> QR
                    </Button>
                  )}
                  {canManage && (
                    <button
                      onClick={() => setEditing(t)}
                      className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                      aria-label={`Editar mesa ${t.code}`}
                    >
                      <Pencil className="size-4" aria-hidden />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {creating && (
        <TableFormModal
          title="Nueva mesa"
          onSubmit={(dto) => createMutation.mutate(dto)}
          loading={createMutation.isPending}
          onClose={() => setCreating(false)}
        />
      )}

      {editing && (
        <TableFormModal
          title={`Editar mesa ${editing.code}`}
          initial={editing}
          onSubmit={(dto) => updateMutation.mutate({ id: editing.idTable, dto })}
          loading={updateMutation.isPending}
          onClose={() => setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(rotating)}
        onClose={() => setRotating(null)}
        onConfirm={() => {
          if (rotating) rotateMutation.mutate(rotating.idTable);
        }}
        title="Generar QR"
        description="Generar un nuevo QR invalida el anterior y cierra las sesiones activas de esta mesa."
        confirmLabel="Generar"
        tone="primary"
      />

      {qr && <QrModal data={qr} onClose={() => setQr(null)} />}
    </div>
  );
}

function TableFormModal({
  title,
  initial,
  onSubmit,
  loading,
  onClose,
}: {
  title: string;
  initial?: RestaurantTable;
  onSubmit: (dto: CreateTableDto) => void;
  loading: boolean;
  onClose: () => void;
}) {
  const form = useForm<z.infer<typeof tableSchema>>({
    resolver: zodResolver(tableSchema),
    defaultValues: initial
      ? { code: initial.code, capacity: initial.capacity, active: initial.active }
      : { code: '', capacity: 2, active: true },
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={form.handleSubmit(onSubmit)} loading={loading}>Guardar</Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <Input label="Código" placeholder="Ej: A1" error={form.formState.errors.code?.message} {...form.register('code')} />
        <Input label="Capacidad" type="number" min={1} error={form.formState.errors.capacity?.message} {...form.register('capacity', { valueAsNumber: true })} />
        <FormCheckbox control={form.control} name="active" label="Activa" />
      </form>
    </Modal>
  );
}


function QrModal({ data, onClose }: { data: { table: RestaurantTable; qrToken: string }; onClose: () => void }) {
  const qrUrl = `${env.appUrl}/mesa?token=${data.qrToken}`;
  return (
    <Modal
      open
      onClose={onClose}
      title={`QR de mesa ${data.table.code}`}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
          <Button onClick={() => window.print()}>
            <Printer className="size-4" aria-hidden /> Imprimir
          </Button>
        </>
      }
    >
      <div className="qr-print flex flex-col items-center gap-4 text-center">
        <QRCodeSVG value={qrUrl} size={220} level="M" />
        <div>
          <p className="font-display text-2xl text-brand-800">Mesa {data.table.code}</p>
          <p className="text-sm text-stone-500">Escaneá para ver el menú y pedir</p>
        </div>
      </div>
    </Modal>
  );
}
