import { useEffect, useRef, useState } from 'react';
import { CoachingImage } from './InstructionViewer';
import GuideIcon from './GuideIcon';
import ShotMetrics from './ShotMetrics';
import { DEMO_DURATION, DEMO_SCENARIOS, demoState, type DemoScenario } from './demo';
import { unavailableShotMetrics } from './metrics';

export default function ShotDemo({ left, onBack }: { left: boolean; onBack: () => void }) {
  const [scenario, setScenario] = useState<DemoScenario>('straight'), [time, setTime] = useState(0), [playing, setPlaying] = useState(false);
  const playback = useRef({ time: 0, at: 0 });
  const stage = useRef<HTMLDivElement>(null);
  const state = demoState(time, scenario, left);
  useEffect(() => {
    if (!playing) return;
    let frame = 0; playback.current = { time, at: performance.now() };
    const tick = (now: number) => {
      const t = Math.min(DEMO_DURATION, playback.current.time + (now - playback.current.at) / 1000);
      setTime(t); if (t >= DEMO_DURATION) setPlaying(false); else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const hide = () => { if (document.hidden) setPlaying(false); };
    document.addEventListener('visibilitychange', hide);
    return () => { cancelAnimationFrame(frame); document.removeEventListener('visibilitychange', hide); };
  }, [playing]);
  const reset = (id: DemoScenario) => { setPlaying(false); setTime(0); setScenario(id); };
  return <section className="shot-demo stack" aria-labelledby="demo-title">
    <button type="button" className="text-back" onClick={onBack}><GuideIcon kind="left" />กลับไปถ่ายของฉัน</button>
    <header className="masthead"><h1 id="demo-title">ดูตัวอย่างผลตี</h1><p className="lede">ดูว่าหลังตีจะแสดงเส้นและผลอย่างไร ก่อนลองกับคลิปของคุณ</p></header>
    <div className="demo-disclosure" role="note"><strong>ตัวอย่างสมมติ · ไม่ใช่ผลวัดจริง</strong><p>ใช้ภาพสาธิต AI กับเส้นและค่าที่กำหนดไว้ ไม่ใช่วิดีโอตีจริงหรือแบบจำลองฟิสิกส์ ไม่บันทึกลงประวัติซ้อม</p></div>
    <div className="row" role="group" aria-label="เลือกตัวอย่างผลตี">{DEMO_SCENARIOS.map(s => <button type="button" className="chip" key={s.id} aria-pressed={scenario === s.id} onClick={() => reset(s.id)}>{s.label}</button>)}</div>
    <div className="demo-player"><button type="button" className="btn btn-small" onClick={() => { if (time >= DEMO_DURATION) setTime(0); setPlaying(x => !x); if (!playing) requestAnimationFrame(() => stage.current?.scrollIntoView({ block: 'center' })); }}>{playing ? 'หยุดตัวอย่าง' : 'เล่นตัวอย่าง'}</button><button type="button" className="btn btn-secondary" onClick={() => reset(scenario)}>เริ่มใหม่</button></div>
    <div className="demo-stage" ref={stage}>
      <figure className="demo-golfer"><CoachingImage id="swing-sequence" frame={state.frame} left={left} alt={`ภาพสาธิต AI: ${state.phase}`} /><figcaption>ภาพ AI ประกอบจังหวะ</figcaption></figure>
      <figure className="demo-flight"><svg viewBox="0 0 600 360" role="img" aria-label={state.lost ? 'เส้นตัวอย่างหยุด ณ จุดที่ติดตามหลุด ไม่มีเส้นต่อไปจุดตก' : 'ภาพจำลองมองจากด้านบน แสดงลูกเคลื่อนจากผู้ตีไปทางเป้า'}>
        <rect width="600" height="360" rx="16" className="demo-field" />
        <path d="M300 320V44M100 180H500" className="demo-target-line" />
        <circle cx="300" cy="78" r="30" className="demo-target" /><circle cx="300" cy="78" r="8" className="demo-target" />
        {state.points.length > 0 && <polyline data-testid="demo-trace" points={state.points.map(p => `${p.x},${p.y}`).join(' ')} className="demo-track" />}
        <circle cx={state.ball.x} cy={state.ball.y} r="10" className="demo-ball" />
        {state.lost && <circle cx={state.ball.x} cy={state.ball.y} r="17" className="demo-lost-point" />}
      </svg><figcaption>แผนภาพวิถีสมมติ · มองจากด้านบน · เป้าอยู่ด้านบน</figcaption></figure>
    </div>
    <div className="demo-phase" role="status" aria-live="polite">{state.phase}{state.lost && <span>เส้นหยุดตรงนี้ ไม่มีการเดาจุดตกหรือระยะ</span>}</div>
    <label className="demo-scrub">เลื่อนตัวอย่าง<input type="range" min="0" max={DEMO_DURATION} step="0.05" value={time} onChange={e => { setPlaying(false); setTime(Number(e.target.value)); }} /></label>
    <section className="demo-results"><h2>ผลตัวอย่าง · เหล็ก 7</h2><p className="muted">{scenario === 'lost' ? 'ข้อมูลไม่พอจึงไม่แสดงค่าช็อต แม้จะเห็นเส้นบางช่วง' : 'ตัวเลขด้านล่างเป็นข้อมูลสมมติทุกค่า ใช้สาธิตหน้าผลลัพธ์เท่านั้น'}</p><ShotMetrics metrics={time >= 5 || state.lost ? state.metrics : unavailableShotMetrics().map(m => ({ ...m, source: 'simulation', reason: 'เล่นหรือเลื่อนไปท้ายตัวอย่างเพื่อดูผลสมมติ' }))} /></section>
    <section className="demo-real"><h2>เมื่อใช้คลิปของคุณ</h2><p>เส้นจริงจะมีเฉพาะจุดที่ตามได้ในภาพ 2D ถ้าติดตามหลุดจะหยุดเส้น ส่วน Carry ความเร็ว มุมปล่อย และสปินจะแสดงว่า “ยังประเมินไม่ได้” จนกว่าจะมีข้อมูลที่ตรวจสอบได้</p><p className="muted">โหมดถ่ายสวิงเต็มตัวกับการอ่านลูกช่วงกระทบต้องจัดกล้องต่างกัน ระบบวัดความเร็วจากมือถือยังเป็นงานวิจัยแยก ไม่ได้เปิดวัดอัตโนมัติในแอปนี้</p></section>
    <button type="button" className="btn btn-primary" onClick={onBack}>กลับไปถ่ายของฉัน</button>
  </section>;
}
