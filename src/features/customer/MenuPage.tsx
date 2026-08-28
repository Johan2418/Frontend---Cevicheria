import { useMemo, useState, type ReactNode } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { catalogApi } from '@/shared/api/catalog';
import { queryKeys } from '@/shared/api/queryKeys';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { cn } from '@/shared/lib/cn';
import { ProductCard } from './ProductCard';

export function MenuPage() {
  const menuQuery = useQuery({ queryKey: queryKeys.menu, queryFn: catalogApi.getMenu });
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

  if (menuQuery.isError) {
    return (
      <EmptyState
        title="No pudimos cargar el menú"
        description="Revisá tu conexión y volvé a intentar en unos momentos."
        action={
          <Button onClick={() => void menuQuery.refetch()} loading={menuQuery.isFetching}>
            Reintentar
          </Button>
        }
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
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400"
          aria-hidden
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar plato…"
          aria-label="Buscar en el menú"
          className="h-11 w-full rounded-lg border border-stone-300 bg-white pl-9 pr-3 text-sm shadow-sm focus:outline-2 focus:outline-brand-600"
        />
      </div>

      {/* Sticks under the shell header so the filter stays reachable while
          scrolling a long menu. */}
      <div className="sticky top-16 z-20 -mx-4 bg-stone-50/95 px-4 py-2 backdrop-blur">
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
      </div>

      {menuQuery.isPending ? (
        <MenuSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description="No encontramos platos con ese criterio. Probá con otro nombre o categoría."
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
            <ProductCard key={p.idProduct} product={p} />
          ))}
        </ul>
      )}
    </div>
  );
}

function MenuSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2" role="status" aria-label="Cargando el menú">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          <Skeleton className="aspect-4/3 w-full rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      ))}
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
        'flex min-h-9 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition-colors',
        active
          ? 'border-brand-700 bg-brand-700 text-white'
          : 'border-stone-200 bg-white text-stone-600 hover:border-brand-300',
      )}
    >
      {children}
    </button>
  );
}

