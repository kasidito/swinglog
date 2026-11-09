import { useState } from 'react';
import type { View } from './guide';
import { HUMAN_GUIDES, guideBounds, humanGuideLayout } from './human-guide';

export default function CameraGuide({ view, left, aspect, visible, opacity, compact }: { view: View; left: boolean; aspect: number; visible: boolean; opacity: number; compact: boolean }) {
  const [loaded, setLoaded] = useState(false), [failed, setFailed] = useState(false);
  const human = visible && loaded && !failed;
  const g = humanGuideLayout(view, left);
  const bounds = guideBounds(aspect), pct = (n: number) => `${n * 100}%`;
  const label = (text: string, x: number, y: number) => <span className="cam-label" style={{ left: pct(x), top: pct(y) }}>{text}</span>;
  return <div className="camera-guide" style={{ left: pct(bounds.left), top: pct(bounds.top), width: pct(bounds.width), height: pct(bounds.height) }}>
    {!failed && <img className="cam-human" src={`${import.meta.env.BASE_URL}${HUMAN_GUIDES[view].src}`} alt={`${HUMAN_GUIDES[view].alt}${left ? ' · ปรับภาพสำหรับผู้ถนัดซ้าย' : ' · ผู้ถนัดขวา'}`} draggable={false} onLoad={() => setLoaded(true)} onError={() => setFailed(true)} style={{ opacity: human ? opacity : 0, transform: left ? 'scaleX(-1)' : undefined, visibility: human ? 'visible' : 'hidden' }} />}
    <svg className="cam-guide" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {!human && <><rect x={g.body.x * 100} y={g.body.y * 100} width={g.body.w * 100} height={g.body.h * 100} rx="3" className="g-zone" /><ellipse cx={g.head.x * 100} cy={g.head.y * 100} rx={g.head.r * 100} ry={g.head.r * 100 * 9 / 16} className="g-line" /><path d={`M${g.hands.x * 100} ${g.hands.y * 100 - 3}v6M${g.hands.x * 100 - 5} ${g.hands.y * 100}h10`} className="g-hands" /></>}
      <line x1="4" x2="96" y1={g.feetY * 100} y2={g.feetY * 100} className="g-line" />
      <ellipse cx={g.ball.x * 100} cy={g.ball.y * 100} rx="2.8" ry={2.8 * 9 / 16} className="g-ball" />
      {g.target && <line x1={g.target.x1 * 100} y1={g.target.y1 * 100} x2={g.target.x2 * 100} y2={g.target.y2 * 100} className="g-target" />}
      <line x1="0" x2="100" y1="12" y2="12" className="g-top" />
    </svg>
    {visible && <span className="cam-model-note" role="status">{failed ? 'ภาพคนโหลดไม่ได้ · ใช้ไกด์เส้นแทน' : !loaded ? 'กำลังโหลดภาพคน…' : 'คน AI · ช่วยจัดเฟรม'}</span>}
    {!human && label('หัว', g.head.x, g.head.y - g.head.r - 0.035)}
    {label('มือ', g.hands.x + (left ? -0.12 : 0.12), g.hands.y)}
    {label('ลูก', g.ball.x, g.ball.y + 0.045)}
    {label('เท้า', left ? 0.85 : 0.15, g.feetY - 0.035)}
    {!compact && label('เหลือที่ให้ไม้ตอน top', 0.5, 0.085)}
    {g.target && label('ทางเป้า', view === 'dtl' ? g.target.x2 + (left ? -0.1 : 0.1) : (left ? 0.2 : 0.8), view === 'dtl' ? 0.16 : 0.9)}
  </div>;
}
