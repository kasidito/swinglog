export type MetricId = 'carry' | 'clubSpeed' | 'ballSpeed' | 'launchAngle' | 'spinRate' | 'smashFactor' | 'headShiftX' | 'headShiftY' | 'spineTilt';
export interface MetricResult {
  id: MetricId; label: string; value: number | null; unit: string;
  source: 'image-2d' | 'calibrated-estimate' | 'simulation' | 'unavailable';
  reason: string;
}
const SPECS: [MetricId, string, string, string][] = [
  ['carry', 'Carry', 'yd', 'ยังไม่มีข้อมูลการปล่อยลูกและสปินที่ตรวจสอบได้'],
  ['clubSpeed', 'Club Speed', 'mph', 'ยังไม่ติดตามหัวไม้พร้อมสอบเทียบระยะและเวลาเฟรม'],
  ['ballSpeed', 'Ball Speed', 'mph', 'เส้น 2D ยังไม่ใช่ระยะจริง และยังไม่ทราบเวลาถ่ายจริง'],
  ['launchAngle', 'Launch Angle', '°', 'ยังไม่สอบเทียบระนาบกล้องกับแนวระดับจริง'],
  ['spinRate', 'Spin Rate', 'rpm', 'ยังอ่านการหมุนลูกหลังชนไม่ได้'],
  ['smashFactor', 'Smash Factor', '', 'ต้องมี Ball Speed และ Club Speed ที่ตรวจสอบได้ทั้งคู่'],
];
export const unavailableShotMetrics = (): MetricResult[] => SPECS.map(([id, label, unit, reason]) => ({ id, label, unit, reason, value: null, source: 'unavailable' }));
export function simulatedShotMetrics(values: [number, number, number, number, number] | null): MetricResult[] {
  const metrics = unavailableShotMetrics();
  if (!values) return metrics.map(m => ({ ...m, reason: 'ตัวอย่างติดตามลูกหลุด จึงไม่เติมค่าช็อตให้' }));
  const [carry, club, ball, launch, spin] = values;
  const xs = [carry, club, ball, launch, spin, Math.round(ball / club * 100) / 100];
  return metrics.map((m, i) => ({ ...m, value: xs[i], source: 'simulation', reason: 'ข้อมูลสมมติสำหรับดูหน้าตาผลลัพธ์ ไม่ได้วัดจากภาพ' }));
}
export function poseMetricResults(m: { xPct: number; yPct: number; spineDeg: number }): MetricResult[] {
  return [
    { id: 'headShiftX', label: 'ศีรษะเลื่อนแนวนอน', value: m.xPct, unit: '% ของความสูงตัวอ้างอิง', source: 'image-2d', reason: 'ค่าประมาณในภาพ เทียบกับ Address' },
    { id: 'headShiftY', label: 'ศีรษะเลื่อนแนวตั้ง', value: m.yPct, unit: '% ของความสูงตัวอ้างอิง', source: 'image-2d', reason: 'ค่าประมาณในภาพ เทียบกับ Address' },
    { id: 'spineTilt', label: 'แนวลำตัวจากแนวตั้ง', value: m.spineDeg, unit: '°', source: 'image-2d', reason: 'มุมฉายในภาพ ไม่ใช่การหมุนลำตัว 3D' },
  ];
}
