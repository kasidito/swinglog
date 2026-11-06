import { describe, expect, it } from 'vitest';
import { headMove, poseMetrics, Landmarks } from './pose';

function body(noseX: number, shoulderShift = 0): Landmarks {
  const lm = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5 }));
  lm[0] = { x: noseX, y: 0.1 };
  lm[11] = { x: 0.45 + shoulderShift, y: 0.25 }; lm[12] = { x: 0.55 + shoulderShift, y: 0.25 };
  lm[23] = { x: 0.46, y: 0.55 }; lm[24] = { x: 0.54, y: 0.55 };
  lm[27] = { x: 0.46, y: 0.9 }; lm[28] = { x: 0.54, y: 0.9 };
  return lm;
}

describe('poseMetrics', () => {
  it('upright spine is 0 degrees', () => {
    expect(poseMetrics(body(0.5), 100, 100).spineDeg).toBe(0);
  });
  it('tilted spine', () => {
    expect(poseMetrics(body(0.5, 0.3), 100, 100).spineDeg).toBe(45);
  });
  it('body height from nose to ankles', () => {
    expect(poseMetrics(body(0.5), 100, 200).bodyHeight).toBeCloseTo(160);
  });
});

describe('headMove', () => {
  it('reports lateral head movement as % of body height', () => {
    const ref = poseMetrics(body(0.5), 100, 100);
    const now = poseMetrics(body(0.58), 100, 100);
    const m = headMove(ref, now, 100, 100);
    expect(m.xPct).toBe(10);
    expect(m.yPct).toBe(0);
  });
});
