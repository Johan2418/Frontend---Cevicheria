import { describe, expect, it } from 'vitest';
import { formatMoney, formatMoneyWhole, formatQuantity, formatDelta } from './money';

describe('formatMoney', () => {
  it('formatea centavos como dólares', () => {
    expect(formatMoney(0)).toContain('0,00');
    expect(formatMoney(1500)).toContain('15,00');
    expect(formatMoney(123456)).toContain('1.234,56');
  });

  it('sin centavos', () => {
    expect(formatMoneyWhole(1500)).toContain('15');
  });
});

describe('formatQuantity / formatDelta', () => {
  it('formatea cantidades con separador de miles', () => {
    expect(formatQuantity(1000)).toBe('1.000');
  });

  it('formatea deltas con signo', () => {
    expect(formatDelta(5)).toBe('+5');
    expect(formatDelta(-5)).toBe('-5');
  });
});
