import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { ShoppingBag, Receipt, QrCode, UtensilsCrossed } from 'lucide-react';
import { BrandLogo } from '@/shared/components/BrandLogo';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { useCartStore, cartCount } from './cartStore';
import { useCartUiStore } from './cartUiStore';
import { useTableSessionStore } from './tableSession';
import { CartDrawer } from './CartDrawer';
import { OrderBar } from './OrderBar';
import { cn } from '@/shared/lib/cn';

export function CustomerShell() {
  const count = useCartStore((s) => cartCount(s.items));
  const table = useTableSessionStore((s) => s.table);
  const location = useLocation();

  const showTableBadge = table && location.pathname !== '/mesa';

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
          <Link to="/mesa" aria-label="CholosBar, inicio">
            <BrandLogo compact={false} />
          </Link>
          <div className="flex items-center gap-2">
            {showTableBadge && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-800">
                <QrCode className="size-4" aria-hidden />
                Mesa {table.code}
              </span>
            )}
            <button
              onClick={() => useCartUiStore.getState().open()}
              className="relative rounded-lg p-2 text-stone-600 hover:bg-stone-100"
              aria-label={`Abrir carrito, ${count} ${count === 1 ? 'artículo' : 'artículos'}`}
            >
              <ShoppingBag className="size-6" aria-hidden />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-accent-500 text-xs font-bold text-white">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main
        className={cn(
          'mx-auto max-w-2xl px-4 pt-4',
          // Clear the tab bar, plus the order bar when it is showing.
          count > 0
            ? 'pb-[calc(9rem+env(safe-area-inset-bottom))]'
            : 'pb-[calc(6rem+env(safe-area-inset-bottom))]',
        )}
      >
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)]"
        aria-label="Navegación principal"
      >
        <div className="mx-auto flex max-w-2xl">
          <TabLink
            to="/mesa/menu"
            label="Menú"
            icon={<UtensilsCrossed className="size-5" aria-hidden />}
          />
          <TabLink
            to="/mesa/ordenes"
            label="Mis pedidos"
            icon={<Receipt className="size-5" aria-hidden />}
          />
        </div>
      </nav>

      <OrderBar />
      <CartDrawer />
    </div>
  );
}

function TabLink({ to, label, icon }: { to: string; label: string; icon: ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors',
          isActive ? 'text-brand-700' : 'text-stone-500 hover:text-stone-700',
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}
