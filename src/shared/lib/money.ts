const usd = new Intl.NumberFormat('es-EC', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const usdNoCents = new Intl.NumberFormat('es-EC', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatMoney(cents: number): string {
  return usd.format(cents / 100);
}

export function formatMoneyWhole(cents: number): string {
  return usdNoCents.format(cents / 100);
}

export function formatQuantity(value: number): string {
  return new Intl.NumberFormat('es-EC').format(value);
}

export function formatDelta(value: number): string {
  return value > 0 ? `+${formatQuantity(value)}` : formatQuantity(value);
}

/**
 * Convierte un monto escrito en dólares (lo que ve el usuario) a los centavos
 * enteros que espera la API. Redondea para evitar los errores de coma flotante
 * de `19.99 * 100`, que el backend rechazaría por no ser entero.
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/** Inversa de `dollarsToCents`, para precargar formularios. */
export function centsToDollars(cents: number): number {
  return cents / 100;
}
