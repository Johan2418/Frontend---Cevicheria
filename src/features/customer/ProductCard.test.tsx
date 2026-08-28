import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductCard } from './ProductCard';
import { useCartStore } from './cartStore';
import type { Product } from '@/shared/types/api';

const product = {
  idProduct: 'p1',
  sku: 'CEV-01',
  name: 'Ceviche de camarón',
  description: 'Camarón fresco, cebolla morada y limón.',
  priceCents: 850,
  imageUrl: null,
  categoryId: 'c1',
  displayOrder: 1,
  active: true,
  visibleInMenu: true,
  trackInventory: true,
} as unknown as Product;

beforeEach(() => {
  useCartStore.setState({ items: [] });
});

describe('ProductCard', () => {
  it('offers a labelled add action, not a bare icon', async () => {
    render(<ProductCard product={product} />);
    expect(screen.getByRole('button', { name: /Agregar Ceviche de camarón al pedido/i })).toBeInTheDocument();
  });

  it('adds the dish to the order at the listed price', async () => {
    const user = userEvent.setup();
    render(<ProductCard product={product} />);

    await user.click(screen.getByRole('button', { name: /Agregar Ceviche de camarón al pedido/i }));

    expect(useCartStore.getState().items).toEqual([
      expect.objectContaining({ productId: 'p1', quantity: 1, priceCents: 850 }),
    ]);
  });

  it('swaps the add button for a stepper once the dish is in the order', async () => {
    const user = userEvent.setup();
    render(<ProductCard product={product} />);

    await user.click(screen.getByRole('button', { name: /Agregar Ceviche de camarón al pedido/i }));

    expect(screen.getByRole('group', { name: /Cantidad de Ceviche de camarón/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Agregar uno de Ceviche de camarón/i }));
    expect(useCartStore.getState().items[0]?.quantity).toBe(2);
  });

  it('removes the dish when the stepper goes below one', async () => {
    const user = userEvent.setup();
    render(<ProductCard product={product} />);

    await user.click(screen.getByRole('button', { name: /Agregar Ceviche de camarón al pedido/i }));
    await user.click(screen.getByRole('button', { name: /^Quitar Ceviche de camarón$/i }));

    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('falls back to a name plate when the dish has no photo', () => {
    render(<ProductCard product={product} />);
    // Name appears twice: once on the plate, once as the card heading.
    expect(screen.getAllByText('Ceviche de camarón').length).toBeGreaterThan(1);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
