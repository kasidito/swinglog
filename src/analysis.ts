import type { Pt } from './trace';
import { headMove, poseMetrics, type Landmarks } from './pose';

export type Phase = 'address' | 'top' | 'impact' | 'finish';
export type PhaseMarks = Partial<Record<Phase, number>>;
export interface ClipInfo { name: string; type: string; bytes: number; width: number; height: number; duration: number }
export interface PoseSample { time: number; landmarks: Landmarks | null }
export interface BallPoint extends Pt { time: number; source: 'manual' | 'detected' }
export interface BallRun { points: BallPoint[]; stoppedAt: number | null; reason: string }
export const PHASES: Phase[] = ['address', 'top', 'impact', 'finish'];

export function validTime(time: number, duration: number) {
  return Number.isFinite(time) && Number.isFinite(duration) && duration > 0 && time >= 0 && time <= duration;
}
export function samplingTimes(start: number, end: number, hz: number, limit: number): number[] {
  if (![start, end, hz, limit].every(Number.isFinite) || start < 0 || end <= start || hz <= 0 || limit < 2) return [];
  const count = Math.min(Math.floor(limit), Math.ceil((end - start) * hz) + 1);
  return Array.from({ length: count }, (_, i) => start + (end - start) * i / (count - 1));
}
/** Seek just inside a timestamp boundary: browsers may otherwise decode the
 * preceding frame due to container time-base rounding. Still approximate. */
export function seekTarget(time: number, duration: number) {
  return Math.min(Math.max(0, time + 0.001), Math.max(0, duration - 0.001));
}
export function phaseOrderValid(marks: PhaseMarks) {
  const xs = PHASES.flatMap(p => marks[p] === undefined ? [] : [marks[p]!]);
  return xs.every((x, i) => Number.isFinite(x) && x >= 0 && (i === 0 || x > xs[i - 1]));
}
export function reliablePose(lm: Landmarks | null): lm is Landmarks {
  if (!lm || lm.length < 29) return false;
  return [0, 11, 12, 23, 24, 27, 28].every(i => {
    const p = lm[i];
    return p && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1 &&
      (p.visibility ?? 0) >= 0.5 && (p.presence === undefined || p.presence >= 0.5);
  }) && Math.abs((lm[27].y + lm[28].y) / 2 - lm[0].y) >= 0.15;
}
export function closestPose(samples: PoseSample[], time: number, tolerance = 0.15): PoseSample | null {
  const sample = samples.reduce<PoseSample | null>((best, s) => !best || Math.abs(s.time - time) < Math.abs(best.time - time) ? s : best, null);
  return sample && Math.abs(sample.time - time) <= tolerance ? sample : null;
}
export function comparePose(samples: PoseSample[], marks: PhaseMarks, width: number, height: number) {
  if (marks.address === undefined || !phaseOrderValid(marks) || width <= 0 || height <= 0) return [];
  const base = closestPose(samples, marks.address);
  if (!base || !reliablePose(base.landmarks)) return [];
  const ref = poseMetrics(base.landmarks, width, height);
  return PHASES.filter(p => p !== 'address').flatMap(phase => {
    const t = marks[phase]; if (t === undefined) return [];
    const s = closestPose(samples, t);
    if (!s || !reliablePose(s.landmarks)) return [];
    const m = poseMetrics(s.landmarks, width, height);
    return [{ phase, time: s.time, spineDeg: m.spineDeg, ...headMove(ref, m, width, height) }];
  });
}

/** Conservative baseline: a small, bright, changed component near the last ball.
 * This is not a trained detector. Stop rather than join an ambiguous object. */
export function findBall(previous: Uint8Array, current: Uint8Array, width: number, height: number, last: Pt, before: Pt | null): Pt | null {
  if (width < 3 || height < 3 || previous.length !== width * height || current.length !== previous.length) return null;
  let globalChange = 0, checked = 0;
  for (let i = 0; i < current.length; i += 17) { globalChange += Math.abs(current[i] - previous[i]) > 35 ? 1 : 0; checked++; }
  if (globalChange / checked > 0.25) return null;
  const lx = last.x * (width - 1), ly = last.y * (height - 1);
  const vx = before ? (last.x - before.x) * (width - 1) : 0;
  const vy = before ? (last.y - before.y) * (height - 1) : 0;
  const radius = Math.min(100, Math.max(28, Math.hypot(vx, vy) * 1.8 + 12));
  const x0 = Math.max(0, Math.floor(lx - radius)), x1 = Math.min(width - 1, Math.ceil(lx + radius));
  const y0 = Math.max(0, Math.floor(ly - radius)), y1 = Math.min(height - 1, Math.ceil(ly + radius));
  const mask = new Uint8Array(width * height);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const i = y * width + x;
    if (current[i] >= 140) mask[i] = 1;
  }
  const candidates: { x: number; y: number; score: number }[] = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const first = y * width + x; if (!mask[first]) continue;
    const queue = [first]; mask[first] = 0; let sx = 0, sy = 0, changed = 0;
    for (let q = 0; q < queue.length; q++) {
      const i = queue[q], px = i % width, py = Math.floor(i / width); sx += px; sy += py; if (current[i] - previous[i] >= 25) changed++;
      for (const [nx, ny] of [[px - 1, py], [px + 1, py], [px, py - 1], [px, py + 1]]) {
        if (nx < x0 || nx > x1 || ny < y0 || ny > y1) continue;
        const ni = ny * width + nx; if (mask[ni]) { mask[ni] = 0; queue.push(ni); }
      }
    }
    if (queue.length < 2 || queue.length > 100 || changed < 2) continue;
    const cx = sx / queue.length, cy = sy / queue.length;
    if (Math.hypot(cx - lx, cy - ly) < 1) continue;
    candidates.push({ x: cx / (width - 1), y: cy / (height - 1), score: Math.hypot(cx - lx - vx, cy - ly - vy) });
  }
  candidates.sort((a, b) => a.score - b.score);
  if (!candidates.length || (candidates.length > 1 && candidates[1].score - candidates[0].score < 5)) return null;
  const { x, y } = candidates[0]; return { x, y };
}
export function correctedRun(run: BallRun, point: BallPoint): BallRun {
  return { points: [...run.points.filter(p => p.time < point.time - 0.001), { ...point, source: 'manual' }], stoppedAt: null, reason: '' };
}
export function makeReport(clip: ClipInfo, view: 'faceon' | 'dtl', left: boolean, marks: PhaseMarks, poses: PoseSample[], ball: BallRun | null) {
  return { schemaVersion: 1, kind: 'swinglog-analysis-experiment', exportedAt: new Date().toISOString(),
    clip, view, handedness: left ? 'left' : 'right', timing: 'browser-seek-approximate-media-time',
    sampling: 'pose up to 120 regular samples plus manually marked phases; ball up to 30 samples/sec (max 120)',
    qualityGate: 'required joint visibility >= 0.5; presence >= 0.5 when available; minimum body span 0.15', ballAlgorithm: 'bright-component-frame-difference-v1',
    phaseMarks: marks, phaseSource: 'manual', poseModel: 'mediapipe-pose-lite-0.10.14', poseSamples: poses,
    comparisons: comparePose(poses, marks, clip.width, clip.height), ballTracking: ball,
    limitations: ['2D image measurements, not a swing diagnosis', 'Time is the encoded media timeline, not necessarily real capture time', 'Ball line segments interpolate sampled points; no extrapolated landing or distance', 'Bright moving-object baseline can fail or follow the wrong object; review every result'],
  };
}
