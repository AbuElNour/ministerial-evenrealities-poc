import { describe, it, expect } from 'vitest';
import { cardContent } from '../src/format-card.js';

describe('cardContent', () => {
  it('joins two lines with newline', () =>
    expect(cardContent({ type: 'agenda', seq: 0, line1: 'A', line2: 'B' })).toBe('A\nB'));
  it('renders single line when line2 absent', () =>
    expect(cardContent({ type: 'close', seq: 0, line1: 'Done' })).toBe('Done'));
  it('clamps overlong lines to 40 chars with ellipsis', () => {
    const out = cardContent({ type: 'agenda', seq: 0, line1: 'x'.repeat(60) });
    expect(out.length).toBe(40);
    expect(out.endsWith('…')).toBe(true);
  });
});
