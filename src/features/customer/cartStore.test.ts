import { beforeEach, describe, expect, it } from 'vitest';
import { useCartStore, cartTotalCents, cartCount } from './cartStore';

const product = {
  productId: 'p1',
  name: 'Ceviche',
  priceCents: 1000,
  imageUrl: null,
};

describe('cartStore', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
  });

  it('agrega un ítem nuevo con cantidad 1', () => {
    useCartStore.getState().addItem(product);
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0]?.quantity).toBe(1);
  });

  it('incrementa la cantidad al agregar el mismo producto', () => {
    const add = useCartStore.getState().addItem;
    add(product);
    add(product);
    expect(useCartStore.getState().items[0]?.quantity).toBe(2);
  });

  it('elimina el ítem al bajar la cantidad a cero', () => {
    useCartStore.getState().addItem(product);
    useCartStore.getState().setQuantity('p1', 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('calcula total y cantidad', () => {
    const items = [
      { ...product, quantity: 2 },
      { productId: 'p2', name: 'Cerveza', priceCents: 250, quantity: 3, imageUrl: null },
    ];
    expect(cartTotalCents(items)).toBe(2 * 1000 + 3 * 250);
    expect(cartCount(items)).toBe(5);
  });
});
