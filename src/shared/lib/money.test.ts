import { describe, expect, it } from 'vitest';
import {
  formatMoney,
  formatMoneyWhole,
  formatQuantity,
  formatDelta,
  dollarsToCents,
  centsToDollars,
} from './money';

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

describe('dollarsToCents', () => {
  it('converts whole and fractional dollars to integer cents', () => {
    expect(dollarsToCents(50)).toBe(5000);
    expect(dollarsToCents(12.5)).toBe(1250);
    expect(dollarsToCents(0)).toBe(0);
  });

  it('accepts string input from number inputs', () => {
    expect(dollarsToCents('12.50')).toBe(1250);
    expect(dollarsToCents('0.05')).toBe(5);
  });

  it('is not thrown off by binary floating point', () => {
    expect(dollarsToCents(1.005)).toBe(101);
    expect(dollarsToCents(50.5)).toBe(5050);
    expect(dollarsToCents(19.99)).toBe(1999);
  });

  it('returns null for values that are not usable money', () => {
    expect(dollarsToCents('')).toBeNull();
    expect(dollarsToCents('abc')).toBeNull();
    expect(dollarsToCents(Number.NaN)).toBeNull();
  });
});

describe('centsToDollars', () => {
  it('renders stored cents as an editable dollar string', () => {
    expect(centsToDollars(1250)).toBe('12.50');
    expect(centsToDollars(5)).toBe('0.05');
    expect(centsToDollars(0)).toBe('0.00');
  });
});
