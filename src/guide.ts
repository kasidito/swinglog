/**
 * Framing guide for filming a swing in portrait.
 * Based on common coaching advice: camera at hand height, hands centred in the frame,
 * about 2.5-3.5 m away, whole body and the club at the top of the backswing in view.
 * All values are fractions of the frame (0..1).
 */
export type View = 'dtl' | 'faceon';

export interface Guide {
  body: { x: number; y: number; w: number; h: number }; // where the golfer should stand
  head: { x: number; y: number; r: number };
  hands: { x: number; y: number };                      // crosshair: keep hands here at address
  ball: { x: number; y: number };
  feetY: number;
  target: { x1: number; y1: number; x2: number; y2: number } | null; // target line arrow
}

export function guideLayout(view: View, left = false): Guide {
  const g: Guide = view === 'dtl'
    ? {
        // Camera behind the golfer on the hand line, looking at the target (up the screen).
        body: { x: 0.28, y: 0.2, w: 0.26, h: 0.66 },
        head: { x: 0.43, y: 0.26, r: 0.045 },
        hands: { x: 0.5, y: 0.52 },
        ball: { x: 0.62, y: 0.84 },
        feetY: 0.86,
        target: { x1: 0.62, y1: 0.8, x2: 0.62, y2: 0.08 },
      }
    : {
        // Camera square to the target line, opposite the middle of the stance.
        body: { x: 0.34, y: 0.2, w: 0.32, h: 0.66 },
        head: { x: 0.5, y: 0.26, r: 0.045 },
        hands: { x: 0.5, y: 0.52 },
        ball: { x: 0.54, y: 0.84 },
        feetY: 0.86,
        target: { x1: 0.72, y1: 0.93, x2: 0.92, y2: 0.93 },
      };
  if (!left) return g;
  const m = (x: number) => 1 - x;
  return {
    body: { ...g.body, x: 1 - g.body.x - g.body.w },
    head: { ...g.head, x: m(g.head.x) },
    hands: { ...g.hands, x: m(g.hands.x) },
    ball: { ...g.ball, x: m(g.ball.x) },
    feetY: g.feetY,
    target: g.target && { x1: m(g.target.x1), y1: g.target.y1, x2: m(g.target.x2), y2: g.target.y2 },
  };
}

export const GUIDE_TIPS: Record<View, string[]> = {
  dtl: [
    'วางกล้องหลังผู้ตี ห่าง 2.5-3.5 เมตร ตรงแนวมือ หันไปทางเป้า',
    'เลนส์สูงเท่ามือตอนจรดลูก (ระดับสะโพก ราว 75-90 ซม. จากพื้น) วัดง่ายๆ: ยืนจรดลูกข้างขาตั้ง แล้วตั้งเลนส์ให้ตรงหัวแม่มือ ตั้งตรง ไม่เอียง',
    'ให้ตัวคนสูงประมาณ 2 ใน 3 ของจอ เหลือที่ด้านบนให้เห็นไม้ตอน top',
  ],
  faceon: [
    'วางกล้องหน้าผู้ตี ห่าง 2.5-3 เมตร ตั้งฉากกับแนวเป้า ตรงกลางระหว่างเท้า',
    'เลนส์สูงเท่ามือตอนจรดลูก (ระดับสะโพก ราว 75-90 ซม. จากพื้น) และตั้งตรง',
    'ให้ตัวคนสูงประมาณ 2 ใน 3 ของจอ ลูกอยู่ใกล้กึ่งกลางล่าง',
  ],
};
