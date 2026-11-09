import type { MetricResult } from './metrics';
const SOURCE = { 'image-2d': 'ค่าประมาณจากภาพ 2D', 'calibrated-estimate': 'ค่าประมาณที่สอบเทียบ', simulation: 'ค่าสมมติ', unavailable: 'ยังประเมินไม่ได้' };
export default function ShotMetrics({ metrics }: { metrics: MetricResult[] }) {
  return <dl className="shot-metrics">{metrics.map(m => <div key={m.id} data-metric={m.id} data-source={m.source}>
    <dt>{m.label}<small>{SOURCE[m.source]}</small></dt>
    <dd><strong>{m.value === null ? '—' : new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(m.value)}</strong>{m.value !== null && m.unit && <span>{m.unit}</span>}<small>{m.reason}</small></dd>
  </div>)}</dl>;
}
