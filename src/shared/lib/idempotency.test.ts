import { describe, expect, it } from 'vitest';
import { newIdempotencyKey } from './idempotency';

describe('newIdempotencyKey', () => {
  it('genera un UUID válido', () => {
    const key = newIdempotencyKey();
    expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('genera claves únicas', () => {
    const keys = new Set(Array.from({ length: 100 }, () => newIdempotencyKey()));
    expect(keys.size).toBe(100);
  });
});
