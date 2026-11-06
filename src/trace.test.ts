import { describe, expect, it } from 'vitest';
import { bezierAt, controlPoint, lineAngle, shapeHint } from './trace';

describe('tracer curve', () => {
  it('passes through start, apex and landing', () => {
    const s = { x: 0.5, y: 0.9 }, a = { x: 0.55, y: 0.2 }, l = { x: 0.7, y: 0.45 };
    const c = controlPoint(s, a, l);
    expect(bezierAt(s, c, l, 0)).toEqual(s);
    const mid = bezierAt(s, c, l, 0.5);
    expect(mid.x).toBeCloseTo(a.x);
    expect(mid.y).toBeCloseTo(a.y);
    const end = bezierAt(s, c, l, 1);
    expect(end.x).toBeCloseTo(l.x);
    expect(end.y).toBeCloseTo(l.y);
  });
});

describe('lineAngle', () => {
  it('measures in pixel space', () => {
    expect(lineAngle({ x: 0, y: 0 }, { x: 1, y: 0 }, 100, 100)).toBe(0);
    expect(lineAngle({ x: 0, y: 0 }, { x: 0, y: 1 }, 100, 100)).toBe(90);
    expect(lineAngle({ x: 0, y: 0 }, { x: 0.5, y: 1 }, 200, 100)).toBe(45);
  });
});

describe('shapeHint', () => {
  const s = { x: 0.5, y: 0.9 };
  it('straight', () => expect(shapeHint(s, { x: 0.5, y: 0.2 }, { x: 0.51, y: 0.4 })).toBe('straight'));
  it('slice curves hard right', () => expect(shapeHint(s, { x: 0.5, y: 0.2 }, { x: 0.65, y: 0.4 })).toBe('slice'));
  it('fade curves a little right', () => expect(shapeHint(s, { x: 0.5, y: 0.2 }, { x: 0.55, y: 0.4 })).toBe('fade'));
  it('hook curves hard left', () => expect(shapeHint(s, { x: 0.5, y: 0.2 }, { x: 0.35, y: 0.4 })).toBe('hook'));
  it('mirrors for left-handers', () => expect(shapeHint(s, { x: 0.5, y: 0.2 }, { x: 0.35, y: 0.4 }, true)).toBe('slice'));
});
