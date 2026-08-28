import { describe, expect, it } from 'vitest';
import { hasLiveOrder, isOrderAborted, isOrderTerminal } from './orderStatus';

describe('isOrderTerminal', () => {
  it('treats every end state as terminal, success included', () => {
    expect(isOrderTerminal('DELIVERED')).toBe(true);
    expect(isOrderTerminal('REJECTED')).toBe(true);
    expect(isOrderTerminal('CANCELLED')).toBe(true);
    expect(isOrderTerminal('EXPIRED')).toBe(true);
  });

  it('does not treat an in-flight order as terminal', () => {
    expect(isOrderTerminal('PENDING')).toBe(false);
    expect(isOrderTerminal('PREPARING')).toBe(false);
    expect(isOrderTerminal('READY')).toBe(false);
  });
});

describe('isOrderAborted', () => {
  // DELIVERED ends the order but completes the happy path, so the progress
  // track must still render it — that is what separates it from aborted.
  it('does not count a delivered order as aborted', () => {
    expect(isOrderAborted('DELIVERED')).toBe(false);
  });

  it('counts orders that left the happy path', () => {
    expect(isOrderAborted('REJECTED')).toBe(true);
    expect(isOrderAborted('CANCELLED')).toBe(true);
    expect(isOrderAborted('EXPIRED')).toBe(true);
  });
});

describe('hasLiveOrder', () => {
  it('keeps polling while any order is still moving', () => {
    expect(hasLiveOrder([{ status: 'DELIVERED' }, { status: 'PREPARING' }])).toBe(true);
  });

  it('stops once every order has finished', () => {
    expect(hasLiveOrder([{ status: 'DELIVERED' }, { status: 'CANCELLED' }])).toBe(false);
  });

  it('stops when there are no orders at all', () => {
    expect(hasLiveOrder([])).toBe(false);
  });
});
