import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { Minus, Plus, Search, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { catalogApi } from '@/shared/api/catalog';
import type { Product } from '@/shared/types/api';
import { formatMoney } from '@/shared/lib/money';
import { FullPageSpinner } from '@/shared/components/ui/Spinner';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { useCartStore, cartCount, cartTotalCents } from './cartStore';
import { useCartUiStore } from './cartUiStore';
import { RequireTableSession } from './RequireTableSession';
import { cn } from '@/shared/lib/cn';

export function MenuPage() {
  return (
    <RequireTableSession>
      <MenuContent />
    </RequireTableSession>
  );
}

function MenuContent() {
  const menuQuery = useQuery({ queryKey: ['menu'], queryFn: catalogApi.getMenu });
  const addItem = useCartStore((s) => s.addItem);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const cartItems = useCartStore((s) => s.items);
  const openCart = useCartUiStore((s) => s.open);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | 'all'>('all');

  // El menú ya viene ordenado por categoría desde la API; el Map preserva ese
  // orden y se indexa por categoryId, que es el campo por el que se filtra.
  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of menuQuery.data ?? []) {
      if (!map.has(p.categoryId)) {
        map.set(p.categoryId, p.category?.name ?? 'Otros');
      }
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [menuQuery.data]);

  const filtered = useMemo(() => {
    let items = menuQuery.data ?? [];
    if (category !== 'all') items = items.filter((p) => p.categoryId === category);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q),
      );
    }
    return items;
  }, [menuQuery.data, category, search]);

  const count = cartCount(cartItems);
  const total = cartTotalCents(cartItems);

  if (menuQuery.isPending) return <FullPageSpinner />;
  if (menuQuery.isError) {
    return (
      <EmptyState
        icon={<UtensilsCrossed className="size-10" aria-hidden />}
        title="No se pudo cargar el menú"
        description="Revisá tu conexión e intentá de nuevo."
        action={
          <Button onClick={() => void menuQuery.refetch()} loading={menuQuery.isFetching}>
            Reintentar
          </Button>
        }
      />
    );
  }

  return (
    <div className={cn('space-y-5', count > 0 && 'pb-24')}>
      <div>
        <h1 className="font-display text-3xl text-brand-800">Nuestro menú</h1>
        <p className="text-sm text-stone-500">Elegí tus favoritos y pedí desde la mesa</p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" aria-hidden />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar plato…"
          aria-label="Buscar en el menú"
          className="h-11 w-full rounded-lg border border-stone-300 bg-white pl-9 pr-3 text-sm shadow-sm focus:outline-2 focus:outline-brand-600"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Categorías">
        <CategoryChip active={category === 'all'} onClick={() => setCategory('all')}>
          Todo
        </CategoryChip>
        {categories.map((c) => (
          <CategoryChip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
            {c.name}
          </CategoryChip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description="No encontramos platos con ese criterio."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setCategory('all');
              }}
            >
              Limpiar filtros
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {filtered.map((p) => (
            <ProductCard
              key={p.idProduct}
              product={p}
              quantity={cartItems.find((i) => i.productId === p.idProduct)?.quantity ?? 0}
              onAdd={() =>
                addItem({
                  productId: p.idProduct,
                  name: p.name,
                  priceCents: p.priceCents,
                  imageUrl: p.imageUrl,
                })
              }
              onSetQuantity={(next) => setQuantity(p.idProduct, next)}
            />
          ))}
        </ul>
      )}

      {count > 0 && (
        <div className="fixed inset-x-0 bottom-[57px] z-20 px-4 pb-2">
          <div className="mx-auto flex max-w-2xl items-center gap-3 rounded-xl bg-brand-800 p-3 text-white shadow-lg">
            <ShoppingBag className="size-5 shrink-0" aria-hidden />
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-semibold">
                {count} {count === 1 ? 'artículo' : 'artículos'}
              </p>
              <p className="text-brand-100">{formatMoney(total)}</p>
            </div>
            <Button variant="accent" size="sm" onClick={() => openCart()}>
              Ver pedido
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/mesa/checkout')}
            >
              Confirmar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={active}
      className={cn(
        'shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'border-brand-700 bg-brand-700 text-white'
          : 'border-stone-200 bg-white text-stone-600 hover:border-brand-300',
      )}
    >
      {children}
    </button>
  );
}

function ProductCard({
  product,
  quantity,
  onAdd,
  onSetQuantity,
}: {
  product: Product;
  quantity: number;
  onAdd: () => void;
  onSetQuantity: (next: number) => void;
}) {
  const inCart = quantity > 0;

  return (
    <li className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-colors focus-within:border-brand-300 hover:border-brand-200">
      <div className="flex gap-3 p-3">
        <div className="flex-1">
          <h3 className="font-semibold text-stone-900">{product.name}</h3>
          {product.description && (
            <p className="mt-1 line-clamp-2 text-sm text-stone-500">{product.description}</p>
          )}
          <p className="mt-2 text-lg font-bold text-brand-800">{formatMoney(product.priceCents)}</p>
          {inCart && (
            <p className="mt-0.5 text-xs font-medium text-brand-700">
              {quantity} en tu pedido · {formatMoney(product.priceCents * quantity)}
            </p>
          )}
        </div>
        <div className="flex w-24 flex-col items-center justify-between gap-2">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt=""
              className="size-20 rounded-lg object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex size-20 items-center justify-center rounded-lg bg-stone-100 text-stone-300">
              <UtensilsCrossed className="size-6" aria-hidden />
            </div>
          )}

          {inCart ? (
            <div className="flex h-9 w-full items-center justify-between rounded-lg border border-brand-200 bg-brand-50">
              <button
                onClick={() => onSetQuantity(quantity - 1)}
                className="flex size-9 items-center justify-center rounded-l-lg text-brand-800 hover:bg-brand-100"
                aria-label={`Quitar uno de ${product.name}`}
              >
                <Minus className="size-4" aria-hidden />
              </button>
              <span
                className="text-sm font-bold text-brand-900"
                aria-label={`${quantity} de ${product.name} en el pedido`}
              >
                {quantity}
              </span>
              <button
                onClick={() => onSetQuantity(quantity + 1)}
                disabled={quantity >= 100}
                className="flex size-9 items-center justify-center rounded-r-lg text-brand-800 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={`Agregar uno de ${product.name}`}
              >
                <Plus className="size-4" aria-hidden />
              </button>
            </div>
          ) : (
            <button
              onClick={onAdd}
              className="flex h-9 w-full items-center justify-center gap-1 rounded-lg bg-brand-700 text-sm font-semibold text-white hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              aria-label={`Agregar ${product.name} al pedido`}
            >
              <Plus className="size-4" aria-hidden /> Agregar
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
