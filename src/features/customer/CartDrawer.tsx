import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, X } from 'lucide-react';
import { useCartStore, cartTotalCents, cartCount } from './cartStore';
import { useCartUiStore } from './cartUiStore';
import { formatMoney } from '@/shared/lib/money';
import { Button } from '@/shared/components/ui/Button';
import { EmptyState } from '@/shared/components/ui/EmptyState';

export function CartDrawer() {
  const { isOpen, close } = useCartUiStore();
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clear = useCartStore((s) => s.clear);
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape para cerrar y bloqueo del scroll de fondo: sin esto el panel se
  // siente atrapado en móvil, que es donde el cliente lo usa.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  const total = cartTotalCents(items);
  const count = cartCount(items);

  return (
    <div className="fixed inset-0 z-50">
      <button
        className="absolute inset-0 bg-stone-900/50"
        onClick={close}
        aria-label="Cerrar carrito"
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de pedido"
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-white shadow-xl focus:outline-none"
      >
        <header className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">Tu pedido</h2>
            {count > 0 && (
              <p className="text-sm text-stone-500">
                {count} {count === 1 ? 'artículo' : 'artículos'}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {items.length > 0 && (
              <button
                onClick={clear}
                className="rounded-lg px-2 py-1 text-sm font-medium text-stone-500 hover:bg-stone-100 hover:text-red-600"
              >
                Vaciar
              </button>
            )}
            <button
              onClick={close}
              className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              aria-label="Cerrar carrito"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
        </header>

        {items.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="size-10" aria-hidden />}
            title="Carrito vacío"
            description="Agregá platos del menú para empezar tu pedido."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  close();
                  navigate('/mesa/menu');
                }}
              >
                Ver el menú
              </Button>
            }
          />
        ) : (
          <>
            <ul className="flex-1 divide-y divide-stone-100 overflow-y-auto px-5">
              {items.map((item) => (
                <li key={item.productId} className="flex items-center gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-stone-900">{item.name}</p>
                    <p className="text-sm text-stone-500">
                      {formatMoney(item.priceCents)} c/u ·{' '}
                      <span className="font-medium text-stone-700">
                        {formatMoney(item.priceCents * item.quantity)}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(item.productId, item.quantity - 1)}
                      className="flex size-8 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50"
                      aria-label={`Quitar uno de ${item.name}`}
                    >
                      <Minus className="size-4" aria-hidden />
                    </button>
                    <span
                      className="w-6 text-center text-sm font-semibold"
                      aria-label={`Cantidad de ${item.name}`}
                    >
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= 100}
                      className="flex size-8 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
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
