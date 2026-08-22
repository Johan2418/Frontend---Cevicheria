import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCartStore, cartTotalCents } from './cartStore';
import { useTableSessionStore } from './tableSession';
import { ordersApi } from '@/shared/api/orders';
import { newIdempotencyKey } from '@/shared/lib/idempotency';
import { formatMoney } from '@/shared/lib/money';
import { Button } from '@/shared/components/ui/Button';
import { Textarea } from '@/shared/components/ui/Textarea';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { toastError, useToast } from '@/shared/components/ui/Toast';
import { RequireTableSession } from './RequireTableSession';
import { useState } from 'react';

export function CheckoutPage() {
  return (
    <RequireTableSession>
      <CheckoutContent />
    </RequireTableSession>
  );
}

function CheckoutContent() {
  const items = useCartStore((s) => s.items);
  const setObservation = useCartStore((s) => s.setObservation);
  const clear = useCartStore((s) => s.clear);
  const token = useTableSessionStore((s) => s.token);
  const table = useTableSessionStore((s) => s.table);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  if (items.length === 0) {
    return (
      <EmptyState
        title="No hay nada en tu pedido"
        description="Volvé al menú para agregar platos."
        action={<Button onClick={() => navigate('/mesa/menu')}>Ver menú</Button>}
      />
    );
  }

  const total = cartTotalCents(items);

  async function confirm() {
    if (!token) return;
    setSubmitting(true);
    try {
      const dto = {
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          observation: i.observation || undefined,
        })),
      };
      await ordersApi.createAppOrder(dto, token, newIdempotencyKey());
      clear();
      toast({ tone: 'success', title: 'Pedido enviado', description: 'La cocina ya está al tanto.' });
      navigate('/mesa/ordenes', { replace: true });
    } catch (e) {
      toast(toastError(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate('/mesa/menu')}
        className="inline-flex items-center gap-1 text-sm font-medium text-stone-600 hover:text-stone-900"
      >
        <ArrowLeft className="size-4" aria-hidden /> Seguir pidiendo
      </button>

      <div>
        <h1 className="font-display text-3xl text-brand-800">Revisá tu pedido</h1>
        <p className="text-sm text-stone-500">Mesa {table?.code}</p>
      </div>

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.productId} className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-stone-900">
                  {item.quantity} × {item.name}
                </p>
                <p className="text-sm text-stone-500">{formatMoney(item.priceCents * item.quantity)}</p>
              </div>
            </div>
            <div className="mt-3">
              <Textarea
                label={`Nota para ${item.name}`}
                placeholder="Ej: sin cebolla, extra limón…"
                rows={2}
                value={item.observation ?? ''}
                onChange={(e) => setObservation(item.productId, e.target.value)}
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="text-stone-600">Total</span>
          <span className="text-2xl font-bold text-stone-900">{formatMoney(total)}</span>
        </div>
      </div>

      <Button className="w-full" size="lg" onClick={confirm} loading={submitting}>
        Confirmar pedido
      </Button>
    </div>
  );
}
