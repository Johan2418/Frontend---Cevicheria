import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime, formatTime, minutesSince } from './date';

// 2026-08-24T02:30:00Z is 2026-08-23 21:30 in America/Guayaquil (UTC-5).
// The date rolls back a day, which is exactly what a business-day report
// must reflect regardless of where the viewer's browser is set.
const CROSSES_MIDNIGHT = '2026-08-24T02:30:00.000Z';

describe('business timezone formatting', () => {
  it('renders date and time in Guayaquil, not browser local', () => {
    expect(formatDateTime(CROSSES_MIDNIGHT)).toBe('23/08/2026 21:30');
  });

  it('renders the business day, not the UTC day', () => {
    expect(formatDate(CROSSES_MIDNIGHT)).toBe('23/08/2026');
  });

  it('renders time with a zero-padded 24h clock', () => {
    expect(formatTime(CROSSES_MIDNIGHT)).toBe('21:30');
    expect(formatTime('2026-08-24T13:05:00.000Z')).toBe('08:05');
  });

  it('returns a dash for missing values', () => {
    expect(formatDateTime(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
    expect(formatTime('')).toBe('—');
  });
});

describe('minutesSince', () => {
  it('counts whole minutes elapsed', () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60_000).toISOString();
    expect(minutesSince(tenMinutesAgo)).toBe(10);
  });

  it('never returns a negative age for a future timestamp', () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    expect(minutesSince(future)).toBe(0);
  });

  it('returns 0 for missing values', () => {
    expect(minutesSince(null)).toBe(0);
  });
});
