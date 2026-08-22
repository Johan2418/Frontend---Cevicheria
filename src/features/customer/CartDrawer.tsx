import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCartStore, cartTotalCents } from './cartStore';
import { useCartUiStore } from './cartUiStore';
import { formatMoney } from '@/shared/lib/money';
import { Button } from '@/shared/components/ui/Button';
import { EmptyState } from '@/shared/components/ui/EmptyState';

export function CartDrawer() {
  const { isOpen, close } = useCartUiStore();
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const total = cartTotalCents(items);

  return (
    <div className="fixed inset-0 z-50">
      <button
        className="absolute inset-0 bg-stone-900/50"
        onClick={close}
        aria-label="Cerrar carrito"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de pedido"
        className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-white shadow-xl"
      >
        <header className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-stone-900">Tu pedido</h2>
          <button
            onClick={close}
            className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
            aria-label="Cerrar"
          >
            <Trash2 className="size-5" aria-hidden />
          </button>
        </header>

        {items.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="size-10" aria-hidden />}
            title="Carrito vacío"
            description="Agregá platos del menú para empezar tu pedido."
          />
        ) : (
          <>
            <ul className="flex-1 divide-y divide-stone-100 overflow-y-auto px-5">
              {items.map((item) => (
                <li key={item.productId} className="flex items-center gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-stone-900">{item.name}</p>
                    <p className="text-sm text-stone-500">{formatMoney(item.priceCents)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(item.productId, item.quantity - 1)}
                      className="flex size-8 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50"
                      aria-label={`Quitar uno de ${item.name}`}
                    >
                      <Minus className="size-4" aria-hidden />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => setQuantity(item.productId, item.quantity + 1)}
                      className="flex size-8 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50"
                      aria-label={`Agregar uno de ${item.name}`}
                    >
                      <Plus className="size-4" aria-hidden />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="rounded p-1.5 text-stone-400 hover:text-red-600"
                    aria-label={`Eliminar ${item.name}`}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>

            <footer className="border-t border-stone-100 p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-stone-500">Total</span>
                <span className="text-xl font-bold text-stone-900">{formatMoney(total)}</span>
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={() => {
                  close();
                  navigate('/mesa/checkout');
                }}
              >
                Continuar
              </Button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
