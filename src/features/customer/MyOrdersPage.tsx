import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Receipt } from 'lucide-react';
import { ordersApi } from '@/shared/api/orders';
import type { Order } from '@/shared/types/api';
import { formatMoney } from '@/shared/lib/money';
import { formatRelative } from '@/shared/lib/date';
import { OrderStatusBadge } from '@/shared/components/OrderStatusBadge';
import { OrderProgress } from './OrderProgress';
import { FullPageSpinner } from '@/shared/components/ui/Spinner';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Button } from '@/shared/components/ui/Button';
import { Modal } from '@/shared/components/ui/Modal';
import { Textarea } from '@/shared/components/ui/Textarea';
import { toastError, useToast } from '@/shared/components/ui/Toast';
import { useTableSessionStore } from './tableSession';
import { queryKeys } from '@/shared/api/queryKeys';
import { hasLiveOrder } from '@/shared/lib/orderStatus';

export function MyOrdersPage() {
  const token = useTableSessionStore((s) => s.token);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [canceling, setCanceling] = useState<Order | null>(null);
  const [reason, setReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const ordersQuery = useQuery({
    queryKey: queryKeys.orders.mine,
    queryFn: () => ordersApi.listMine(token!),
    // Keep tracking while an order is still moving, even if the diner has
    // switched apps — the status is the whole point of this screen. Polling
    // stops once everything is delivered or cancelled, so a tab left open
    // after the meal does not keep waking the phone.
    refetchInterval: (query) => (hasLiveOrder(query.state.data ?? []) ? 10_000 : false),
    refetchIntervalInBackground: true,
  });

  if (ordersQuery.isPending) return <FullPageSpinner />;
  if (ordersQuery.isError) {
    return (
      <EmptyState
        icon={<Receipt className="size-10" aria-hidden />}
        title="No se pudieron cargar tus pedidos"
        description="Revisá tu conexión e intentá de nuevo."
        action={
          <Button onClick={() => void ordersQuery.refetch()} loading={ordersQuery.isFetching}>
            Reintentar
          </Button>
        }
      />
    );
  }

  const orders = ordersQuery.data ?? [];

  async function confirmCancel() {
    if (!canceling || !token || cancelling) return;
    setCancelling(true);
    try {
      await ordersApi.cancel(canceling.idOrder, { reason }, token);
      toast({ tone: 'success', title: 'Pedido cancelado' });
      setCanceling(null);
      setReason('');
      await queryClient.invalidateQueries({ queryKey: queryKeys.orders.mine });
    } catch (e) {
      toast(toastError(e));
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl text-brand-800">Mis pedidos</h1>
        <p className="text-sm text-stone-500">Seguí el estado de tus pedidos en tiempo real</p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={<Receipt className="size-10" aria-hidden />}
          title="Todavía no has pedido"
          description="Cuando hagas un pedido lo verás acá."
        />
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.idOrder} className="rounded-xl border border-stone-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <OrderStatusBadge status={order.status} />
                  <span className="text-xs text-stone-400">{formatRelative(order.createdAt)}</span>
                </div>
                <span className="font-bold tabular-nums text-stone-900">
                  {formatMoney(order.totalCents)}
                </span>
              </div>

              <OrderProgress status={order.status} />

              <ul className="mt-3 space-y-1">
                {order.items.map((item) => (
                  <li key={item.idOrderItem} className="flex justify-between text-sm text-stone-600">
                    <span>
                      {item.quantity} × {item.productNameSnapshot}
                    </span>
                    <span>{formatMoney(item.subtotalCents)}</span>
                  </li>
                ))}
              </ul>
              {order.status === 'PENDING' && (
                <div className="mt-3 border-t border-stone-100 pt-3">
                  <Button variant="outline" size="sm" onClick={() => setCanceling(order)}>
                    Cancelar pedido
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={Boolean(canceling)}
        onClose={() => setCanceling(null)}
        title="Cancelar pedido"
        description="Contanos por qué cancelás para poder mejorar."
        footer={
          <>
            <Button variant="outline" onClick={() => setCanceling(null)}>
              Volver
            </Button>
            <Button
              variant="danger"
              onClick={confirmCancel}
              loading={cancelling}
              disabled={reason.trim().length < 3}
            >
              Confirmar cancelación
            </Button>
          </>
        }
      >
        <Textarea
          label="Motivo"
          placeholder="Ej: me equivoqué de plato"
          rows={3}
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          hint="Mínimo 3 caracteres"
        />
      </Modal>
    </div>
  );
}
