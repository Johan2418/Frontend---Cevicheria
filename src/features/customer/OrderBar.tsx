import { useLocation } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { cartCount, cartTotalCents, useCartStore } from './cartStore';
import { useCartUiStore } from './cartUiStore';
import { formatMoney } from '@/shared/lib/money';

/**
 * Persistent summary of the running order, sitting just above the tab bar.
 * It replaces the old behaviour of throwing the cart drawer open on every add,
 * which interrupted browsing — the diner opens the order when they choose to.
 * Hidden while the cart is empty and while the drawer is already showing.
 */
export function OrderBar() {
  const items = useCartStore((s) => s.items);
  const openCart = useCartUiStore((s) => s.open);
  const isCartOpen = useCartUiStore((s) => s.isOpen);

  const { pathname } = useLocation();

  const count = cartCount(items);
  // Checkout already shows the order and its total; a second summary there
  // would just repeat itself over the confirm button.
  if (count === 0 || isCartOpen || pathname === '/mesa/checkout') return null;

  const total = cartTotalCents(items);

  return (
    <div className="fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-30 px-4 pb-2">
      <button
        onClick={openCart}
        className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 rounded-xl bg-brand-700 px-4 py-3 text-white shadow-lg transition-colors hover:bg-brand-800 active:bg-brand-900"
      >
        <span className="flex items-center gap-2">
          <span className="relative">
            <ShoppingBag className="size-5" aria-hidden />
          </span>
          <span className="text-sm font-semibold">
            {count} {count === 1 ? 'plato' : 'platos'}
          </span>
        </span>
        <span className="text-sm font-semibold">
          Ver pedido · <span className="tabular-nums">{formatMoney(total)}</span>
        </span>
      </button>
    </div>
  );
}
