import { simulatedShotMetrics } from './metrics';
export type DemoScenario = 'straight' | 'fade' | 'lost';
export const DEMO_DURATION = 6;
export const DEMO_IMPACT = 1.8;
export const DEMO_LOST_AT = 3.2;
export const DEMO_SCENARIOS: { id: DemoScenario; label: string }[] = [{ id: 'straight', label: 'ลูกตรง' }, { id: 'fade', label: 'ลูกโค้ง' }, { id: 'lost', label: 'ติดตามหลุด' }];
/** This is a scripted overhead diagram, not a physics model or detected shot. */
export function demoState(time: number, scenario: DemoScenario, left = false) {
  const t = Number.isFinite(time) ? Math.max(0, Math.min(DEMO_DURATION, time)) : 0;
  const lost = scenario === 'lost' && t >= DEMO_LOST_AT;
  const fraction = Math.max(0, Math.min(1, ((lost ? DEMO_LOST_AT : t) - DEMO_IMPACT) / 3.2));
  const position = (f: number) => ({ x: 300 + (scenario === 'fade' ? (left ? -1 : 1) * 120 * f * f : 0), y: 308 - 230 * f });
  const points = t < DEMO_IMPACT ? [] : Array.from({ length: Math.floor(fraction * 60) + 1 }, (_, i) => position(Math.min(i / 60, fraction)));
  if (points.length && fraction > 0) points.push(position(fraction));
  return { time: t, lost, fraction, points, ball: position(fraction), frame: t < 0.8 ? 0 : t < DEMO_IMPACT ? 1 : 2,
    phase: t < 0.8 ? 'ตั้งท่า' : t < DEMO_IMPACT ? 'ขึ้นไม้' : t < 2.1 ? 'กระทบลูก (สมมติ)' : t < 5 ? lost ? 'หยุดเมื่อจุดลูกหลุด' : 'ลูกเคลื่อนที่ (จำลอง)' : 'สรุปผลตัวอย่าง',
    metrics: simulatedShotMetrics(scenario === 'lost' ? null : scenario === 'fade' ? [138, 78, 102, 19, 6400] : [145, 78, 105, 18, 6200]) };
}
