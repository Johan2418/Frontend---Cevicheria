import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, XCircle, Check, History } from 'lucide-react';
import { useAuthStore } from '@/shared/auth/store';
import { PERMISSIONS } from '@/shared/lib/permissions';
import { ordersApi, type TransitionOrderDto } from '@/shared/api/orders';
import type { Order, OrderStatus } from '@/shared/types/api';
import { formatMoney } from '@/shared/lib/money';
import { formatTime } from '@/shared/lib/date';
import { Button } from '@/shared/components/ui/Button';
import { Modal } from '@/shared/components/ui/Modal';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Select } from '@/shared/components/ui/Select';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { FullPageSpinner } from '@/shared/components/ui/Spinner';
import { Badge } from '@/shared/components/ui/Badge';
import { toastError, useToast } from '@/shared/components/ui/Toast';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { queryKeys } from '@/shared/api/queryKeys';
import { ORDER_STATUS_LABEL } from '@/shared/components/OrderStatusBadge';
import { OrderAge } from './OrderAge';
import { cn } from '@/shared/lib/cn';
import { ManualOrderModal } from './ManualOrderModal';

const COLUMNS: { status: OrderStatus; label: string; tone: string }[] = [
  { status: 'PENDING', label: 'Pendiente', tone: 'border-t-amber-400' },
  { status: 'ACCEPTED', label: 'Aceptado', tone: 'border-t-sky-400' },
  { status: 'PREPARING', label: 'Preparando', tone: 'border-t-brand-500' },
  { status: 'READY', label: 'Listo', tone: 'border-t-accent-500' },
  { status: 'DELIVERED', label: 'Entregado', tone: 'border-t-emerald-500' },
];

const NEXT_ACTION: Partial<Record<OrderStatus, { to: OrderStatus; label: string }[]>> = {
  PENDING: [{ to: 'ACCEPTED', label: 'Aceptar' }],
  ACCEPTED: [{ to: 'PREPARING', label: 'Preparar' }],
  PREPARING: [{ to: 'READY', label: 'Listo' }],
  READY: [{ to: 'DELIVERED', label: 'Entregar' }],
};

export function KitchenPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [manualOpen, setManualOpen] = useState(false);
  const [rejecting, setRejecting] = useState<Order | null>(null);
  const [historyOrder, setHistoryOrder] = useState<Order | null>(null);

  const ordersQuery = useQuery({
    queryKey: queryKeys.orders.operational,
    queryFn: () => ordersApi.listOperational({ limit: 100 }),
    refetchInterval: 8000,
    // Keep the previous board on screen while refetching, so the columns do
    // not blank out every eight seconds while someone is reading a ticket.
    placeholderData: keepPreviousData,
  });

  const transitionMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: TransitionOrderDto }) =>
      ordersApi.transition(id, dto),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all }),
    onError: (e) => toast(toastError(e)),
  });

  if (ordersQuery.isPending) return <FullPageSpinner />;

  const orders = ordersQuery.data ?? [];
  const canTransition = hasPermission(PERMISSIONS.ORDER_TRANSITION);
  const canManual = hasPermission(PERMISSIONS.ORDER_CREATE_MANUAL);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Cocina" description="Seguí y avanzá el estado de los pedidos" />
        {canManual && (
          <Button onClick={() => setManualOpen(true)}>
            <Plus className="size-4" aria-hidden /> Pedido manual
          </Button>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.status);
          return (
            <section
              key={col.status}
              aria-label={col.label}
              className={cn('w-72 shrink-0 rounded-xl border border-stone-200 border-t-4 bg-stone-100/60', col.tone)}
            >
              <header className="flex items-center justify-between px-4 py-3">
                <h2 className="font-semibold text-stone-800">{col.label}</h2>
                <Badge tone="neutral">{colOrders.length}</Badge>
              </header>
              <ul className="space-y-3 px-3 pb-3">
                {colOrders.map((order) => (
                  <OrderCard
                    key={order.idOrder}
                    order={order}
                    canTransition={canTransition}
                    canCancelException={hasPermission(PERMISSIONS.ORDER_CANCEL_EXCEPTION)}
                    onTransition={(to) => transitionMutation.mutate({ id: order.idOrder, dto: { targetStatus: to } })}
                    onReject={() => setRejecting(order)}
                    onHistory={() => setHistoryOrder(order)}
                  />
                ))}
                {colOrders.length === 0 && (
                  <li className="rounded-lg border border-dashed border-stone-300 py-6 text-center text-xs text-stone-400">
                    Sin pedidos
                  </li>
                )}
              </ul>
            </section>
          );
        })}
      </div>

      {manualOpen && <ManualOrderModal onClose={() => setManualOpen(false)} />}

      {rejecting && (
        <RejectModal
          onClose={() => setRejecting(null)}
          onConfirm={(reason) => {
            transitionMutation.mutate({
              id: rejecting.idOrder,
              dto: { targetStatus: 'REJECTED', reason },
            });
            setRejecting(null);
          }}
        />
      )}

      {historyOrder && <HistoryModal orderId={historyOrder.idOrder} onClose={() => setHistoryOrder(null)} />}
    </div>
  );
}

function OrderCard({
  order,
  canTransition,
  canCancelException,
  onTransition,
  onReject,
  onHistory,
}: {
  order: Order;
  canTransition: boolean;
  canCancelException: boolean;
  onTransition: (to: OrderStatus) => void;
  onReject: () => void;
  onHistory: () => void;
}) {
  const [confirmTo, setConfirmTo] = useState<OrderStatus | null>(null);
  const actions = NEXT_ACTION[order.status] ?? [];
  const isPending = order.status === 'PENDING';
  const showCancelException =
    canCancelException && (order.status === 'PREPARING' || order.status === 'READY');

  return (
    <li className="rounded-lg border border-stone-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-stone-900">
          {order.table ? `Mesa ${order.table.code}` : order.origin === 'MANUAL' ? 'Manual' : 'App'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-xs text-stone-400">{formatTime(order.createdAt)}</span>
          <OrderAge createdAt={order.createdAt} status={order.status} />
        </span>
      </div>

      <ul className="mt-2 space-y-1 text-sm">
        {order.items.map((item) => (
          <li key={item.idOrderItem} className="text-stone-700">
            <span className="font-medium">{item.quantity}×</span> {item.productNameSnapshot}
            {item.observation && (
              <span className="block text-xs italic text-stone-400">· {item.observation}</span>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-2 flex items-center justify-between">
        <span className="font-bold text-stone-900">{formatMoney(order.totalCents)}</span>
        <button
          onClick={onHistory}
          className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
          aria-label={`Historial del pedido ${order.idOrder.slice(0, 8)}`}
        >
          <History className="size-4" aria-hidden />
        </button>
      </div>

      {canTransition && actions.length > 0 && (
        <div className="mt-3 flex gap-2">
          {actions.map((action) => (
            <Button
              key={action.to}
              size="sm"
              className="flex-1"
              onClick={() => setConfirmTo(action.to)}
            >
              <Check className="size-4" aria-hidden /> {action.label}
            </Button>
          ))}
          {isPending && (
            <Button size="sm" variant="danger" className="flex-1" onClick={onReject}>
              <XCircle className="size-4" aria-hidden /> Rechazar
            </Button>
          )}
        </div>
      )}

      {showCancelException && (
        <div className="mt-2">
          <CancelExceptionButton order={order} />
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmTo)}
        onClose={() => setConfirmTo(null)}
        onConfirm={() => {
          if (confirmTo) onTransition(confirmTo);
          setConfirmTo(null);
        }}
        title="Cambiar estado"
        description={
          confirmTo ? `¿Avanzar el pedido a "${ORDER_STATUS_LABEL[confirmTo]}"?` : undefined
        }
        confirmLabel="Confirmar"
        tone="primary"
      />
    </li>
  );
}

function CancelExceptionButton({ order }: { order: Order }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (v: { reason: string; resolution: 'RETURN_TO_STOCK' | 'WASTE' }) =>
      ordersApi.cancelException(order.idOrder, v),
    onSuccess: () => {
      toast({ tone: 'success', title: 'Pedido cancelado' });
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
    onError: (e) => toast(toastError(e)),
  });

  return (
    <>
      <Button size="sm" variant="ghost" className="w-full text-red-600" onClick={() => setOpen(true)}>
        Cancelar excepción
      </Button>
      <CancelExceptionModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={(reason, resolution) => mutation.mutate({ reason, resolution })}
        loading={mutation.isPending}
      />
    </>
  );
}

function RejectModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <Modal
      open
      onClose={onClose}
      title="Rechazar pedido"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="danger" onClick={() => onConfirm(reason)} disabled={reason.trim().length < 3}>
            Rechazar
          </Button>
        </>
      }
    >
      <Textarea
        label="Motivo"
        placeholder="Motivo del rechazo (mínimo 3 caracteres)"
        rows={3}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
    </Modal>
  );
}

function CancelExceptionModal({
  open,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string, resolution: 'RETURN_TO_STOCK' | 'WASTE') => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState('');
  const [resolution, setResolution] = useState<'RETURN_TO_STOCK' | 'WASTE'>('RETURN_TO_STOCK');
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cancelar pedido (excepción)"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            variant="danger"
            loading={loading}
            onClick={() => onConfirm(reason, resolution)}
            disabled={reason.trim().length < 3}
          >
            Confirmar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Select label="Resolución" value={resolution} onChange={(e) => setResolution(e.target.value as 'RETURN_TO_STOCK' | 'WASTE')}>
          <option value="RETURN_TO_STOCK">Devolver a inventario</option>
          <option value="WASTE">Desperdicio</option>
        </Select>
        <Textarea
          label="Motivo"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
    </Modal>
  );
}

function HistoryModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const historyQuery = useQuery({
    queryKey: queryKeys.orders.history(orderId),
    queryFn: () => ordersApi.getHistory(orderId),
  });

  return (
    <Modal open onClose={onClose} title="Historial del pedido" size="sm">
      {historyQuery.isPending ? (
        <FullPageSpinner />
      ) : (
        <ol className="space-y-3">
          {(historyQuery.data ?? []).map((h) => (
            <li key={h.idOrderStatusHistory} className="flex items-start gap-3">
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-500" aria-hidden />
              <div>
                <p className="text-sm font-medium text-stone-800">{h.nextStatus}</p>
                <p className="text-xs text-stone-500">
                  {formatTime(h.createdAt)}
                  {h.reason ? ` · ${h.reason}` : ''}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Modal>
  );
}
