import { beforeEach, describe, expect, it } from 'vitest';
import { useTableSessionStore } from './tableSession';
import { useCartStore } from './cartStore';

const mesaA = {
  idTable: 't1',
  code: 'A1',
  capacity: 4,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mesaB = { ...mesaA, idTable: 't2', code: 'B2' };

const producto = { productId: 'p1', name: 'Ceviche', priceCents: 1000, imageUrl: null };

function enElFuturo(minutos: number): string {
  return new Date(Date.now() + minutos * 60_000).toISOString();
}

describe('tableSessionStore', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
    useTableSessionStore.setState({ table: null, token: null, expiresAt: null });
  });

  it('mantiene el carrito al renovar la sesión de la misma mesa', () => {
    const store = useTableSessionStore.getState();
    store.setSession(mesaA, 'token-1', enElFuturo(60));
    useCartStore.getState().addItem(producto);

    useTableSessionStore.getState().setSession(mesaA, 'token-2', enElFuturo(120));

    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useTableSessionStore.getState().token).toBe('token-2');
  });

  it('vacía el carrito al cambiar de mesa', () => {
    useTableSessionStore.getState().setSession(mesaA, 'token-1', enElFuturo(60));
    useCartStore.getState().addItem(producto);

    useTableSessionStore.getState().setSession(mesaB, 'token-2', enElFuturo(60));

    expect(useCartStore.getState().items).toHaveLength(0);
    expect(useTableSessionStore.getState().table?.code).toBe('B2');
  });

  it('vacía el carrito al cerrar la sesión de mesa', () => {
    useTableSessionStore.getState().setSession(mesaA, 'token-1', enElFuturo(60));
    useCartStore.getState().addItem(producto);

    useTableSessionStore.getState().clear();

    expect(useCartStore.getState().items).toHaveLength(0);
    expect(useTableSessionStore.getState().token).toBeNull();
  });

  it('hasSession es falso cuando la sesión ya venció', () => {
    useTableSessionStore.getState().setSession(mesaA, 'token-1', enElFuturo(-1));
    expect(useTableSessionStore.getState().hasSession()).toBe(false);
  });

  it('pruneIfExpired descarta la sesión vencida y deja limpio el estado', () => {
    useTableSessionStore.getState().setSession(mesaA, 'token-1', enElFuturo(-1));
    useCartStore.getState().addItem(producto);

    expect(useTableSessionStore.getState().pruneIfExpired()).toBe(true);
    expect(useTableSessionStore.getState().token).toBeNull();
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('pruneIfExpired no toca una sesión vigente', () => {
    useTableSessionStore.getState().setSession(mesaA, 'token-1', enElFuturo(60));

    expect(useTableSessionStore.getState().pruneIfExpired()).toBe(false);
    expect(useTableSessionStore.getState().token).toBe('token-1');
  });
});
