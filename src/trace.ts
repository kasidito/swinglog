export interface Pt { x: number; y: number } // normalized 0..1 of the video frame

/** Quadratic Bezier control point so the curve passes through `apex` at t = 0.5. */
export function controlPoint(start: Pt, apex: Pt, land: Pt): Pt {
  return { x: 2 * apex.x - (start.x + land.x) / 2, y: 2 * apex.y - (start.y + land.y) / 2 };
}

export function bezierAt(start: Pt, ctrl: Pt, land: Pt, t: number): Pt {
  const u = 1 - t;
  return { x: u * u * start.x + 2 * u * t * ctrl.x + t * t * land.x, y: u * u * start.y + 2 * u * t * ctrl.y + t * t * land.y };
}

/** Angle of a drawn line from horizontal, in degrees 0..90, using pixel space. */
export function lineAngle(a: Pt, b: Pt, width: number, height: number): number {
  const dx = Math.abs((b.x - a.x) * width);
  const dy = Math.abs((b.y - a.y) * height);
  return Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
}

/**
 * Rough shape hint from a down-the-line tracer (camera behind the golfer, target up the screen).
 * Compares the apex and landing offsets from the start line. Only a hint: the golfer confirms it.
 */
export function shapeHint(start: Pt, apex: Pt, land: Pt, left = false): 'hook' | 'draw' | 'straight' | 'fade' | 'slice' {
  const sign = left ? -1 : 1;
  const apexOff = (apex.x - start.x) * sign;
  const curve = (land.x - apex.x) * sign; // positive = curving right for a right-hander
  const total = Math.abs(apexOff) + Math.abs(curve);
  if (total < 0.03 || Math.abs(curve) < 0.02) return 'straight';
  if (curve > 0) return curve > 0.08 ? 'slice' : 'fade';
  return curve < -0.08 ? 'hook' : 'draw';
}
