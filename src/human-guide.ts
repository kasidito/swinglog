import type { Guide, View } from './guide';

/** Framing illustrations, not measured anatomical targets. Coordinates were
 * screened against the selected local rasters after generation. */
export const HUMAN_GUIDES: Record<View, { src: string; alt: string; layout: Guide }> = {
  dtl: {
    src: 'camera-guides/dtl.webp',
    alt: 'ภาพคน AI มุมตามแนวตี เห็นด้านหลังและด้านข้าง ยืนจรดลูกกับเหล็ก ตัวเอนไปหาลูก มือจับไม้ด้านหน้าตัว',
    layout: { body: { x: 0.11, y: 0.21, w: 0.48, h: 0.65 }, head: { x: 0.49, y: 0.27, r: 0.07 }, hands: { x: 0.445, y: 0.57 }, ball: { x: 0.654, y: 0.836 }, feetY: 0.862, target: { x1: 0.654, y1: 0.80, x2: 0.654, y2: 0.12 } },
  },
  faceon: {
    src: 'camera-guides/faceon.webp',
    alt: 'ภาพคน AI มุมด้านหน้า เห็นเท้าสองข้างแยกกัน มือทั้งสองจับไม้หน้าลำตัว ลูกอยู่ระหว่างเท้าและข้างหน้าแนวปลายเท้า',
    layout: { body: { x: 0.27, y: 0.21, w: 0.46, h: 0.64 }, head: { x: 0.5, y: 0.27, r: 0.07 }, hands: { x: 0.5, y: 0.57 }, ball: { x: 0.515, y: 0.85 }, feetY: 0.85, target: { x1: 0.72, y1: 0.93, x2: 0.92, y2: 0.93 } },
  },
};

export function humanGuideLayout(view: View, left: boolean): Guide {
  const g = HUMAN_GUIDES[view].layout;
  if (!left) return g;
  return { ...g, body: { ...g.body, x: 1 - g.body.x - g.body.w }, head: { ...g.head, x: 1 - g.head.x }, hands: { ...g.hands, x: 1 - g.hands.x }, ball: { ...g.ball, x: 1 - g.ball.x }, target: g.target && { ...g.target, x1: 1 - g.target.x1, x2: 1 - g.target.x2 } };
}

/** Fit the complete portrait reference into any camera aspect without stretch. */
export function guideBounds(aspect: number) {
  const reference = 9 / 16;
  const width = Math.min(1, reference / aspect), height = Math.min(1, aspect / reference);
  return { left: (1 - width) / 2, top: (1 - height) / 2, width, height };
}
