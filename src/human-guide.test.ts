import { describe, expect, it } from 'vitest';
import { guideBounds } from './human-guide';

describe('human reference frame', () => {
  it('keeps the whole portrait reference proportional and inside native camera frames', () => {
    for (const aspect of [9 / 16, 16 / 9, 1, 9 / 20]) {
      const b = guideBounds(aspect);
      expect(b.width * aspect / b.height).toBeCloseTo(9 / 16);
      expect(b.left).toBeGreaterThanOrEqual(0); expect(b.top).toBeGreaterThanOrEqual(0);
      expect(b.left + b.width).toBeLessThanOrEqual(1);
      expect(b.top + b.height).toBeLessThanOrEqual(1);
      expect(b.width === 1 || b.height === 1).toBe(true);
    }
  });
});
