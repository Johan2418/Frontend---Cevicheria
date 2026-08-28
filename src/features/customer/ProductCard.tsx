import { Minus, Plus } from 'lucide-react';
import type { Product } from '@/shared/types/api';
import { formatMoney } from '@/shared/lib/money';
import { useCartStore } from './cartStore';

/**
 * Stands in for a missing photo. Rather than a grey box, the dish name is set
 * in the display face on a deep teal field, echoing the hand-painted signage of
 * a coastal marisquería — so a menu with patchy photography still looks styled.
 */
function NamePlate({ name }: { name: string }) {
  return (
    <div className="flex size-full flex-col items-center justify-center bg-brand-800 px-4 py-6 text-center">
      <span className="font-display text-2xl leading-tight text-white/95 [text-wrap:balance]">
        {name}
      </span>
      <span className="mt-2 h-0.5 w-8 rounded-full bg-accent-500" aria-hidden />
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const quantity = useCartStore(
    (s) => s.items.find((i) => i.productId === product.idProduct)?.quantity ?? 0,
  );

  const add = () =>
    addItem({
      productId: product.idProduct,
      name: product.name,
      priceCents: product.priceCents,
      imageUrl: product.imageUrl,
    });

  return (
    <li className="flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="aspect-4/3 w-full overflow-hidden bg-stone-100">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt=""
            className="size-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <NamePlate name={product.name} />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-semibold text-stone-900">{product.name}</h3>
        {product.description && (
          <p className="line-clamp-2 text-sm text-stone-500">{product.description}</p>
        )}

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-lg font-bold text-brand-800 tabular-nums">
            {formatMoney(product.priceCents)}
          </span>

          {quantity === 0 ? (
            <button
              onClick={add}
              className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-800 active:bg-brand-900"
              aria-label={`Agregar ${product.name} al pedido`}
            >
              <Plus className="size-4" aria-hidden />
              Agregar
            </button>
          ) : (
            <div
              className="flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 p-1"
              // The group is labelled so a screen reader announces which dish
              // these unlabelled-looking +/- controls belong to.
              role="group"
              aria-label={`Cantidad de ${product.name}`}
            >
              <button
                onClick={() => setQuantity(product.idProduct, quantity - 1)}
                className="flex size-11 items-center justify-center rounded-md text-brand-800 transition-colors hover:bg-brand-100"
                aria-label={quantity === 1 ? `Quitar ${product.name}` : `Quitar uno de ${product.name}`}
              >
                <Minus className="size-4" aria-hidden />
              </button>
              <span className="w-6 text-center text-sm font-bold tabular-nums text-brand-900">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(product.idProduct, quantity + 1)}
                className="flex size-11 items-center justify-center rounded-md text-brand-800 transition-colors hover:bg-brand-100"
                aria-label={`Agregar uno de ${product.name}`}
              >
                <Plus className="size-4" aria-hidden />
              </button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
