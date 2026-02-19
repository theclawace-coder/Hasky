import { describe, expect, it } from 'vitest';
import { formatCurrency, formatDate, toTitleCase } from './utils';

describe('utils', () => {
  it('formats currency in AUD', () => {
    expect(formatCurrency(1250.5)).toBe('$1,250.50');
  });

  it('formats date values', () => {
    expect(formatDate('2026-02-16')).toContain('2026');
  });

  it('converts snake_case to title case', () => {
    expect(toTitleCase('under_repair')).toBe('Under Repair');
  });
});
