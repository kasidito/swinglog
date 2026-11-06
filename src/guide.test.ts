import { describe, expect, it } from 'vitest';
import { guideLayout } from './guide';

describe('guideLayout', () => {
  for (const view of ['dtl', 'faceon'] as const) {
    it(`${view}: hands centred, body about two thirds of the frame, everything inside`, () => {
      const g = guideLayout(view);
      expect(g.hands).toEqual({ x: 0.5, y: 0.52 });
      expect(g.body.h).toBeGreaterThanOrEqual(0.6);
      expect(g.body.h).toBeLessThanOrEqual(0.7);
      expect(g.body.y).toBeGreaterThanOrEqual(0.15); // room for the club at the top
      for (const v of [g.body.x, g.body.x + g.body.w, g.ball.x, g.ball.y, g.feetY]) {
        expect(v).toBeGreaterThan(0);
        expect(v).toBeLessThan(1);
      }
    });
    it(`${view}: mirrors for left-handers`, () => {
      const r = guideLayout(view), l = guideLayout(view, true);
      expect(l.ball.x).toBeCloseTo(1 - r.ball.x);
      expect(l.body.x + l.body.w).toBeCloseTo(1 - r.body.x);
    });
  }
});
