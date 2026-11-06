import type { Pt } from './trace';

// Pinned runtime assets. These load in the browser at first use; the app works without them.
export const MP_VERSION = '0.10.14';
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/wasm`;
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

export type Landmarks = Pt[]; // 33 normalized points (MediaPipe Pose order)

/** Skeleton segments to draw (MediaPipe Pose indices). */
export const BONES: [number, number][] = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28],
];

type Detector = { detect: (img: HTMLVideoElement) => { landmarks: { x: number; y: number }[][] } };
let detector: Promise<Detector> | null = null;

async function create(): Promise<Detector> {
  const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision');
  const vision = await FilesetResolver.forVisionTasks(WASM_URL);
  const make = (delegate: 'GPU' | 'CPU') =>
    PoseLandmarker.createFromOptions(vision, { baseOptions: { modelAssetPath: MODEL_URL, delegate }, runningMode: 'IMAGE', numPoses: 1 });
  try { return (await make('GPU')) as unknown as Detector; } catch { return (await make('CPU')) as unknown as Detector; }
}

export async function detectPose(video: HTMLVideoElement): Promise<Landmarks | null> {
  if (!detector) detector = create().catch((e) => { detector = null; throw e; });
  const d = await detector;
  const r = d.detect(video);
  const lm = r.landmarks?.[0];
  return lm && lm.length >= 29 ? lm.map((p) => ({ x: p.x, y: p.y })) : null;
}

const mid = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

export interface PoseMetrics {
  spineDeg: number;     // spine tilt from vertical, degrees
  head: Pt;             // nose
  bodyHeight: number;   // nose to mid-ankle, pixels
}

export function poseMetrics(lm: Landmarks, width: number, height: number): PoseMetrics {
  const hip = mid(lm[23], lm[24]), sh = mid(lm[11], lm[12]), ankle = mid(lm[27], lm[28]);
  const dx = (sh.x - hip.x) * width, dy = (hip.y - sh.y) * height;
  const spineDeg = Math.round((Math.atan2(Math.abs(dx), Math.abs(dy)) * 180) / Math.PI);
  const bodyHeight = Math.max(1, Math.abs(ankle.y - lm[0].y) * height);
  return { spineDeg, head: lm[0], bodyHeight };
}

/** Head movement between two frames, as % of body height (positive x = right on screen, positive y = down). */
export function headMove(ref: PoseMetrics, now: PoseMetrics, width: number, height: number) {
  const base = ref.bodyHeight;
  return {
    xPct: Math.round(((now.head.x - ref.head.x) * width * 100) / base),
    yPct: Math.round(((now.head.y - ref.head.y) * height * 100) / base),
    spineChange: now.spineDeg - ref.spineDeg,
  };
}
