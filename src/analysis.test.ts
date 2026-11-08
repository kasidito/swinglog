import { describe, expect, it } from 'vitest';
import { closestPose, comparePose, correctedRun, findBall, makeReport, phaseOrderValid, reliablePose, samplingTimes, seekTarget, validTime } from './analysis';
import type { Landmarks } from './pose';

const body = (): Landmarks => {
  const xs = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0.99, presence: 0.99 }));
  xs[0].y = 0.1; xs[11].y = xs[12].y = 0.3; xs[23].y = xs[24].y = 0.6; xs[27].y = xs[28].y = 0.9; return xs;
};
const scene = (points: [number, number][] = [], background = 20) => {
  const gray = new Uint8Array(100 * 100).fill(background);
  for (const [x, y] of points) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) gray[(y + dy) * 100 + x + dx] = 240;
  return gray;
};
describe('sampling and manual phase order', () => {
  it('rejects invalid metadata and ranges instead of producing NaN timestamps', () => {
    for (const x of [NaN, Infinity, -1]) expect(validTime(x, 4)).toBe(false);
    expect(validTime(0, Infinity)).toBe(false);
    expect(samplingTimes(3, 2, 30, 120)).toEqual([]);
    expect(samplingTimes(0, 1, 0, 120)).toEqual([]);
  });
  it('bounds sampling memory while retaining both endpoints', () => {
    const ts = samplingTimes(0, 10, 30, 120);
    expect(ts).toHaveLength(120); expect(ts[0]).toBe(0); expect(ts[ts.length - 1]).toBe(10);
    expect(ts.every((t, i) => !i || t > ts[i - 1])).toBe(true);
  });
  it('seeks inside frame boundaries and never beyond the clip', () => {
    expect(seekTarget(2 / 30, 3)).toBeGreaterThan(2 / 30);
    expect(seekTarget(3, 3)).toBe(2.999);
    expect(seekTarget(0, 0.0005)).toBe(0);
  });
  it('allows partial markers but rejects equal or reversed times', () => {
    expect(phaseOrderValid({ top: 1, finish: 3 })).toBe(true);
    expect(phaseOrderValid({ address: 2, top: 1 })).toBe(false);
    expect(phaseOrderValid({ address: 1, impact: 1 })).toBe(false);
  });
});
describe('evidence-based pose comparison', () => {
  it('rejects occluded, collapsed or unknown-quality landmarks', () => {
    const lm = body(); expect(reliablePose(lm)).toBe(true);
    const sdk = body().map(({ presence: _, ...p }) => p); expect(reliablePose(sdk)).toBe(true);
    lm[11].presence = 0.1; expect(reliablePose(lm)).toBe(false); lm[11].presence = 0.99;
    lm[11].visibility = 0.1; expect(reliablePose(lm)).toBe(false);
    expect(reliablePose(Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5 })))).toBe(false);
    const flat = body(); flat[27].y = flat[28].y = flat[0].y; expect(reliablePose(flat)).toBe(false);
  });
  it('does not borrow a stale skeleton from a distant or failed sample', () => {
    expect(closestPose([{ time: 0, landmarks: body() }], 1)).toBe(null);
    const samples = [{ time: 0, landmarks: body() }, { time: 1, landmarks: null }];
    expect(comparePose(samples, { address: 0, impact: 1 }, 1920, 1080)).toEqual([]);
  });
  it('compares the manually selected reference without diagnosing a fault', () => {
    const lm = body(); lm[0].x += 0.08;
    const result = comparePose([{ time: 0, landmarks: body() }, { time: 1, landmarks: lm }], { address: 0, impact: 1 }, 100, 100);
    expect(result[0].xPct).toBe(10); expect(result[0].phase).toBe('impact');
    expect(result[0]).not.toHaveProperty('diagnosis');
  });
});
describe('conservative ball baseline', () => {
  it('follows a visible moving component', () => {
    const p = findBall(scene([[50, 60]]), scene([[54, 55]]), 100, 100, { x: 50 / 99, y: 60 / 99 }, null);
    expect(p?.x).toBeCloseTo(54 / 99); expect(p?.y).toBeCloseTo(55 / 99);
  });
  it('stops on a static scene or camera-wide change', () => {
    expect(findBall(scene([[50, 60]]), scene([[50, 60]]), 100, 100, { x: 0.5, y: 0.6 }, null)).toBe(null);
    expect(findBall(scene(), scene([], 220), 100, 100, { x: 0.5, y: 0.6 }, null)).toBe(null);
  });
  it('refuses equally plausible bright objects', () => {
    expect(findBall(scene([[50, 60]]), scene([[45, 55], [55, 55]]), 100, 100, { x: 50 / 99, y: 60 / 99 }, null)).toBe(null);
  });
  it('does not jump to an out-of-range object or invalid image', () => {
    expect(findBall(scene([[50, 60]]), scene([[95, 5]]), 100, 100, { x: 0.5, y: 0.6 }, null)).toBe(null);
    expect(findBall(new Uint8Array(1), scene(), 100, 100, { x: 0.5, y: 0.5 }, null)).toBe(null);
  });
  it('correction invalidates downstream observations for a fresh run', () => {
    const run = correctedRun({ points: [{ time: 0, x: 0.1, y: 0.2, source: 'manual' }, { time: 1, x: 0.2, y: 0.2, source: 'detected' }, { time: 2, x: 0.3, y: 0.2, source: 'detected' }], stoppedAt: 3, reason: 'lost' }, { time: 1, x: 0.4, y: 0.5, source: 'manual' });
    expect(run.points.map(p => p.time)).toEqual([0, 1]); expect(run.points[1].source).toBe('manual'); expect(run.stoppedAt).toBe(null);
  });
});
it('exports analysis data and provenance without video bytes or URLs', () => {
  const result = makeReport({ name: 'swing.mp4', type: 'video/mp4', bytes: 100, width: 1920, height: 1080, duration: 4 }, 'faceon', true, { impact: 1 }, [], null);
  expect(result.handedness).toBe('left'); expect(result.phaseSource).toBe('manual');
  expect(result.timing).toContain('approximate'); expect(result).not.toHaveProperty('video'); expect(JSON.stringify(result)).not.toContain('blob:');
});
