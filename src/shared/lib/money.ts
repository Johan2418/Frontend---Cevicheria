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
