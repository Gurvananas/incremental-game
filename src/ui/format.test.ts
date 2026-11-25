import { describe, expect, it } from 'vitest';
import { formatDuration, formatNumber, formatRate } from './format';

const en = { locale: 'en' } as const;
const fr = { locale: 'fr' } as const;

describe('formatNumber', () => {
  it('shows small numbers with up to two decimals', () => {
    expect(formatNumber(0, en)).toBe('0');
    expect(formatNumber(12.345, en)).toBe('12.35');
    expect(formatNumber(999.99, en)).toBe('999.99');
  });

  it('uses the decimal comma in French', () => {
    expect(formatNumber(12.5, fr)).toBe('12,5');
  });

  it('uses suffixes from a thousand up', () => {
    expect(formatNumber(1234, en)).toBe('1.23k');
    expect(formatNumber(12_345_678, en)).toBe('12.3M');
    expect(formatNumber(-1500, en)).toBe('-1.5k');
  });

  it('puts a narrow no-break space before the suffix in French', () => {
    expect(formatNumber(1234, fr)).toBe('1,23 k');
  });

  it('rounds up to the next suffix instead of showing 1000k', () => {
    expect(formatNumber(999_950, en)).toBe('1M');
  });

  it('switches to scientific notation past the last suffix, or on request', () => {
    expect(formatNumber(1e36, en)).toBe('1e36');
    expect(formatNumber(1.5e6, { locale: 'en', notation: 'scientific' })).toBe('1.5e6');
  });

  it('handles values that are not finite', () => {
    expect(formatNumber(Number.NaN, en)).toBe('?');
    expect(formatNumber(Number.POSITIVE_INFINITY, en)).toBe('∞');
  });
});

describe('formatRate', () => {
  it('signs positive rates', () => {
    expect(formatRate(0.5, en)).toBe('+0.5/s');
    expect(formatRate(-2, en)).toBe('-2/s');
  });
});

describe('formatDuration', () => {
  it('picks a readable unit', () => {
    expect(formatDuration(45)).toBe('45 s');
    expect(formatDuration(600)).toBe('10 min');
    expect(formatDuration(3600)).toBe('1 h');
    expect(formatDuration(7500)).toBe('2 h 5 min');
  });
});
