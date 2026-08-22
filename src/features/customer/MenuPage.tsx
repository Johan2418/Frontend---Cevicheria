import { useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { catalogApi } from '@/shared/api/catalog';
import type { Product } from '@/shared/types/api';
import { formatMoney } from '@/shared/lib/money';
import { FullPageSpinner } from '@/shared/components/ui/Spinner';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { useCartStore } from './cartStore';
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
  const openCart = useCartUiStore((s) => s.open);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | 'all'>('all');

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of menuQuery.data ?? []) {
      if (p.category) map.set(p.category.idCategory, p.category.name);
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [menuQuery.data]);

  const filtered = useMemo(() => {
    let items = menuQuery.data ?? [];
    if (category !== 'all') items = items.filter((p) => p.categoryId === category);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter((p) => p.name.toLowerCase().includes(q));
    }
    return items;
  }, [menuQuery.data, category, search]);

  if (menuQuery.isPending) return <FullPageSpinner />;
  if (menuQuery.isError) {
    return (
      <EmptyState
        title="No se pudo cargar el menú"
        description="Intentalo de nuevo en unos momentos."
      />
    );
  }

  return (
    <div className="space-y-5">
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
        <EmptyState title="Sin resultados" description="No encontramos platos con ese criterio." />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {filtered.map((p) => (
            <ProductCard
              key={p.idProduct}
              product={p}
              onAdd={() => {
                addItem({
                  productId: p.idProduct,
                  name: p.name,
                  priceCents: p.priceCents,
                  imageUrl: p.imageUrl,
                });
                openCart();
              }}
            />
          ))}
        </ul>
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

function ProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  return (
    <li className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="flex gap-3 p-3">
        <div className="flex-1">
          <h3 className="font-semibold text-stone-900">{product.name}</h3>
          {product.description && (
            <p className="mt-1 line-clamp-2 text-sm text-stone-500">{product.description}</p>
          )}
          <p className="mt-2 text-lg font-bold text-brand-800">{formatMoney(product.priceCents)}</p>
        </div>
        <div className="flex flex-col items-center justify-between gap-2">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt=""
              className="size-20 rounded-lg object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex size-20 items-center justify-center rounded-lg bg-stone-100 text-stone-300">
              <Plus className="size-6" aria-hidden />
            </div>
          )}
          <button
            onClick={onAdd}
            className="flex h-9 w-full items-center justify-center gap-1 rounded-lg bg-brand-700 text-white hover:bg-brand-800"
            aria-label={`Agregar ${product.name} al carrito`}
          >
            <Plus className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </li>
  );
}
