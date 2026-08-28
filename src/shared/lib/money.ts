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

/**
 * Converts a user-entered dollar amount into integer cents, which is the unit
 * every money field in the API expects. Rounds through a fixed-decimal string
 * so binary floating point cannot shift the result (1.005 * 100 is 100.4999…).
 * Returns null for values that are not usable money.
 */
export function dollarsToCents(value: number | string): number | null {
  const amount = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (!Number.isFinite(amount)) return null;
  return Math.round(Number((amount * 100).toFixed(4)));
}

/** Inverse of dollarsToCents, for prefilling an edit form from stored cents. */
export function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function formatQuantity(value: number): string {
  return new Intl.NumberFormat('es-EC').format(value);
}

export function formatDelta(value: number): string {
  return value > 0 ? `+${formatQuantity(value)}` : formatQuantity(value);
}
