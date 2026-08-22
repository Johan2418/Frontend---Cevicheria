import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, CheckCircle2, XCircle, Ban } from 'lucide-react';
import { ordersApi } from '@/shared/api/orders';
import { paymentsApi, PAYMENT_METHOD_LABEL, type CreatePaymentDto } from '@/shared/api/payments';
import type { ApiError } from '@/shared/api/client';
import type { Order, Payment } from '@/shared/types/api';
import { formatMoney } from '@/shared/lib/money';
import { Card, CardBody, CardHeader } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Modal } from '@/shared/components/ui/Modal';
import { Select } from '@/shared/components/ui/Select';
import { Input } from '@/shared/components/ui/Input';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Badge } from '@/shared/components/ui/Badge';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { FullPageSpinner } from '@/shared/components/ui/Spinner';
import { toastError, useToast } from '@/shared/components/ui/Toast';

export function PaymentsPage() {
  const ordersQuery = useQuery({
    queryKey: ['orders', 'operational'],
    queryFn: () => ordersApi.listOperational({ limit: 100 }),
    refetchInterval: 8000,
  });

  if (ordersQuery.isPending) return <FullPageSpinner />;

  const chargeable = (ordersQuery.data ?? []).filter(
    (o) => o.status === 'DELIVERED' || o.status === 'READY',
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Pagos</h1>
        <p className="text-sm text-stone-500">Declará y verificá los pagos de cada pedido</p>
      </div>

      <Card>
        <CardHeader title="Pedidos por cobrar" description="Pedidos listos o entregados" />
        <CardBody>
          {chargeable.length === 0 ? (
            <EmptyState
              icon={<CreditCard className="size-10" aria-hidden />}
              title="Sin pedidos por cobrar"
              description="Cuando haya pedidos listos aparecerán acá."
            />
          ) : (
            <ul className="divide-y divide-stone-100">
              {chargeable.map((order) => (
                <PaymentRow key={order.idOrder} order={order} />
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function PaymentRow({ order }: { order: Order }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);

  const paymentQuery = useQuery({
    queryKey: ['payment', order.idOrder],
    queryFn: () => paymentsApi.getForOrder(order.idOrder),
    retry: false,
  });

  const payment = paymentQuery.data;

  const verifyMutation = useMutation({
    mutationFn: (id: string) => paymentsApi.verify(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['payment', order.idOrder] }),
    onError: (e) => toast(toastError(e)),
  });

  if (paymentQuery.isPending) {
    return <li className="py-3 text-sm text-stone-400">Cargando…</li>;
  }

  const noPayment = paymentQuery.isError && (paymentQuery.error as unknown as ApiError)?.status === 404;

  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-stone-900">
          {order.table ? `Mesa ${order.table.code}` : 'Manual'}
        </p>
        <p className="text-sm text-stone-500">{formatMoney(order.totalCents)}</p>
      </div>

      {noPayment ? (
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          Declarar pago
        </Button>
      ) : payment ? (
        <div className="flex items-center gap-2">
          <Badge tone={PAYMENT_STATUS_TONE[payment.status]}>{PAYMENT_STATUS_LABEL[payment.status]}</Badge>
          <span className="text-sm text-stone-500">{PAYMENT_METHOD_LABEL[payment.method]}</span>
          {payment.status === 'PENDING' && (
            <>
              <Button size="sm" onClick={() => verifyMutation.mutate(payment.idPayment)} loading={verifyMutation.isPending}>
                <CheckCircle2 className="size-4" aria-hidden /> Verificar
              </Button>
              <Button size="sm" variant="outline" onClick={() => setRejectOpen(true)}>
                <XCircle className="size-4" aria-hidden /> Rechazar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setVoidOpen(true)}>
                <Ban className="size-4" aria-hidden /> Anular
              </Button>
            </>
          )}
        </div>
      ) : null}

      {createOpen && <CreatePaymentModal order={order} onClose={() => setCreateOpen(false)} />}
      {rejectOpen && payment && (
        <ReasonModal
          title="Rechazar pago"
          onClose={() => setRejectOpen(false)}
          onSubmit={(reason) =>
            paymentsApi.reject(payment.idPayment, { reason }).then(() => {
              setRejectOpen(false);
              void queryClient.invalidateQueries({ queryKey: ['payment', order.idOrder] });
            })
          }
        />
      )}
      {voidOpen && payment && (
        <ReasonModal
          title="Anular pago"
          onClose={() => setVoidOpen(false)}
          onSubmit={(reason) =>
            paymentsApi.void(payment.idPayment, { reason }).then(() => {
              setVoidOpen(false);
              void queryClient.invalidateQueries({ queryKey: ['payment', order.idOrder] });
            })
          }
        />
      )}
    </li>
  );
}

const PAYMENT_STATUS_LABEL: Record<Payment['status'], string> = {
  PENDING: 'Pendiente',
  VERIFIED: 'Verificado',
  REJECTED: 'Rechazado',
  VOIDED: 'Anulado',
};

const PAYMENT_STATUS_TONE: Record<Payment['status'], 'warning' | 'success' | 'danger' | 'neutral'> = {
  PENDING: 'warning',
  VERIFIED: 'success',
  REJECTED: 'danger',
  VOIDED: 'neutral',
};

const paymentSchema = z.object({
  method: z.enum(['CASH', 'TRANSFER', 'OTHER']),
  reference: z.string().max(120).optional(),
});

function CreatePaymentModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { method: 'CASH', reference: '' },
  });

  const mutation = useMutation({
    mutationFn: (v: z.infer<typeof paymentSchema>) => {
      const dto: CreatePaymentDto = {
        orderId: order.idOrder,
        method: v.method,
        reference: v.reference || undefined,
      };
      return paymentsApi.create(dto);
    },
    onSuccess: () => {
      toast({ tone: 'success', title: 'Pago declarado' });
      onClose();
      void queryClient.invalidateQueries({ queryKey: ['payment', order.idOrder] });
    },
    onError: (e) => toast(toastError(e)),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={`Cobrar ${order.table ? `mesa ${order.table.code}` : 'pedido manual'}`}
      description={`Total: ${formatMoney(order.totalCents)}`}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={form.handleSubmit((v) => mutation.mutate(v))} loading={mutation.isPending}>
            Declarar
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={form.handleSubmit((v) => mutation.mutate(v))} noValidate>
        <Select label="Método" error={form.formState.errors.method?.message} {...form.register('method')}>
          <option value="CASH">Efectivo</option>
          <option value="TRANSFER">Transferencia</option>
          <option value="OTHER">Otro</option>
        </Select>
        <Input label="Referencia (opcional)" error={form.formState.errors.reference?.message} {...form.register('reference')} />
      </form>
    </Modal>
  );
}

function ReasonModal({
  title,
  onClose,
  onSubmit,
}: {
  title: string;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<unknown>;
}) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handle() {
    setLoading(true);
    try {
      await onSubmit(reason);
      toast({ tone: 'success', title: 'Operación completada' });
    } catch (e) {
      toast(toastError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="danger" onClick={handle} loading={loading} disabled={reason.trim().length < 3}>
            Confirmar
          </Button>
        </>
      }
    >
      <Textarea label="Motivo" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
    </Modal>
  );
}
