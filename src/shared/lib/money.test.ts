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
  it('convierte dólares a centavos enteros', () => {
    expect(dollarsToCents(50)).toBe(5000);
    expect(dollarsToCents(0)).toBe(0);
  });

  it('redondea montos con decimales sin arrastrar errores de coma flotante', () => {
    expect(dollarsToCents(19.99)).toBe(1999);
    expect(dollarsToCents(1.1)).toBe(110);
    expect(Number.isInteger(dollarsToCents(8.35))).toBe(true);
  });

  it('es la inversa de centsToDollars', () => {
    expect(centsToDollars(dollarsToCents(123.45))).toBeCloseTo(123.45);
  });
});
