import { useEffect, useRef, useState } from 'react';
import type { Flight } from './engine';
import { Pt, bezierAt, controlPoint, lineAngle, shapeHint } from './trace';
import { BONES, Landmarks, PoseMetrics, detectPose, headMove, poseMetrics } from './pose';

type Mode = 'view' | 'line' | 'trace';
interface Line { a: Pt; b: Pt }

const FLIGHT_LABEL: Record<Flight, string> = { hook: 'ฮุก', draw: 'draw', straight: 'ตรง', fade: 'fade', slice: 'สไลซ์' };
const ORDER: Flight[] = ['hook', 'draw', 'straight', 'fade', 'slice'];
const STEP = 1 / 30;

export default function Analyze({ left, canLog, onLog }: { left: boolean; canLog: boolean; onLog: (f: Flight) => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('view');
  const [lines, setLines] = useState<Line[]>([]);
  const [draft, setDraft] = useState<Line | null>(null);
  const [trace, setTrace] = useState<Pt[]>([]);
  const [speed, setSpeed] = useState(0.5);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [flight, setFlight] = useState<Flight | null>(null);
  const [msg, setMsg] = useState('');
  const [pose, setPose] = useState<Landmarks | null>(null);
  const [ref, setRef] = useState<PoseMetrics | null>(null);
  const [poseMsg, setPoseMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const camInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  const pick = (f: File | undefined) => {
    if (!f) return;
    setUrl(URL.createObjectURL(f));
    setLines([]); setTrace([]); setFlight(null); setMsg(''); setMode('view'); setTime(0); setPose(null); setRef(null); setPoseMsg('');
  };

  const sizeCanvas = () => {
    const v = video.current, c = canvas.current;
    if (!v || !c) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = v.clientWidth * dpr; c.height = v.clientHeight * dpr;
    c.style.width = `${v.clientWidth}px`; c.style.height = `${v.clientHeight}px`;
    draw();
  };

  const draw = () => {
    const c = canvas.current, v = video.current;
    if (!c || !v) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const W = c.width, H = c.height, dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, W, H);
    const P = (p: Pt) => [p.x * W, p.y * H] as const;
    const stroke = (color: string, width: number) => { ctx.strokeStyle = color; ctx.lineWidth = width * dpr; ctx.lineCap = 'round'; };
    for (const l of [...lines, ...(draft ? [draft] : [])]) {
      const [ax, ay] = P(l.a), [bx, by] = P(l.b);
      stroke('#0E1512', 6); ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      stroke('#7FD69A', 3); ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      const deg = lineAngle(l.a, l.b, v.clientWidth, v.clientHeight);
      ctx.font = `${14 * dpr}px sans-serif`; ctx.fillStyle = '#0E1512';
      ctx.fillRect(bx + 6 * dpr, by - 18 * dpr, 44 * dpr, 20 * dpr);
      ctx.fillStyle = '#FFFFFF'; ctx.fillText(`${deg}°`, bx + 10 * dpr, by - 3 * dpr);
    }
    if (pose) {
      for (const [color, w] of [['#0E1512', 6], ['#5CC8FF', 3]] as const) {
        stroke(color, w);
        for (const [i, j] of BONES) { const [ax, ay] = P(pose[i]), [bx, by] = P(pose[j]); ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); }
      }
      const [hx, hy] = P(pose[0]);
      ctx.strokeStyle = '#5CC8FF'; ctx.lineWidth = 3 * dpr; ctx.beginPath(); ctx.arc(hx, hy, 14 * dpr, 0, Math.PI * 2); ctx.stroke();
      if (ref) {
        const [rx, ry] = P(ref.head);
        ctx.setLineDash([6 * dpr, 6 * dpr]); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2 * dpr;
        ctx.beginPath(); ctx.arc(rx, ry, 14 * dpr, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      }
    }
    if (trace.length === 3) {
      const [s, a, l] = trace; const cp = controlPoint(s, a, l);
      for (const [color, w] of [['#0E1512', 7], ['#E4B04A', 4]] as const) {
        stroke(color, w); ctx.beginPath();
        for (let t = 0; t <= 1.0001; t += 0.02) { const p = bezierAt(s, cp, l, t); const [x, y] = P(p); t === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.stroke();
      }
    }
    trace.forEach((p, i) => {
      const [x, y] = P(p);
      ctx.fillStyle = '#E4B04A'; ctx.strokeStyle = '#0E1512'; ctx.lineWidth = 2 * dpr;
      ctx.beginPath(); ctx.arc(x, y, 8 * dpr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#0E1512'; ctx.font = `bold ${11 * dpr}px sans-serif`; ctx.fillText(String(i + 1), x - 3 * dpr, y + 4 * dpr);
    });
  };

  useEffect(draw, [lines, draft, trace, pose, ref]);
  useEffect(() => {
    const on = () => sizeCanvas();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  });
  useEffect(() => { if (video.current) video.current.playbackRate = speed; }, [speed, url]);

  const norm = (e: React.PointerEvent): Pt => {
    const r = canvas.current!.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) };
  };
  const onDown = (e: React.PointerEvent) => {
    if (mode === 'line') { const p = norm(e); setDraft({ a: p, b: p }); (e.target as Element).setPointerCapture(e.pointerId); }
    if (mode === 'trace' && trace.length < 3) {
      const next = [...trace, norm(e)];
      setTrace(next);
      if (next.length === 3) { const [s, a, l] = next; setFlight(shapeHint(s, a, l, left)); setMode('view'); }
    }
  };
  const onMove = (e: React.PointerEvent) => { if (mode === 'line' && draft) setDraft({ ...draft, b: norm(e) }); };
  const onUp = () => { if (mode === 'line' && draft) { setLines((ls) => [...ls, draft]); setDraft(null); } };

  const toggle = () => {
    const v = video.current; if (!v) return;
    if (v.paused) { v.play().catch(() => setMsg('เล่นวิดีโอไม่ได้ ลองแตะอีกครั้ง')); } else v.pause();
  };
  const step = (d: number) => {
    const v = video.current; if (!v) return;
    v.pause(); v.currentTime = Math.min(v.duration || 0, Math.max(0, v.currentTime + d));
  };
  const analyzePose = async (asRef: boolean) => {
    const v = video.current; if (!v) return;
    v.pause(); setBusy(true); setPoseMsg('กำลังวิเคราะห์ท่า ครั้งแรกต้องโหลดโมเดลประมาณ 5 MB…');
    try {
      const lm = await detectPose(v);
      if (!lm) { setPose(null); setPoseMsg('ไม่เจอตัวคนในเฟรมนี้ ลองเฟรมที่เห็นตัวเต็มและแสงพอ'); return; }
      setPose(lm);
      const m = poseMetrics(lm, v.videoWidth || v.clientWidth, v.videoHeight || v.clientHeight);
      if (asRef || !ref) { setRef(m); setPoseMsg(`ตั้งเฟรมนี้เป็นท่า address แล้ว · ลำตัวเอียง ${m.spineDeg}° จากแนวตั้ง · เลื่อนไปเฟรมอื่นแล้วกด "ตรวจท่าเฟรมนี้" เพื่อเทียบ`); return; }
      const d = headMove(ref, m, v.videoWidth || v.clientWidth, v.videoHeight || v.clientHeight);
      const side = d.xPct === 0 ? 'ไม่ขยับซ้ายขวา' : `ขยับ${d.xPct > 0 ? 'ขวา' : 'ซ้าย'} ${Math.abs(d.xPct)}%`;
      const up = d.yPct === 0 ? 'ไม่ขยับขึ้นลง' : `${d.yPct > 0 ? 'ลง' : 'ขึ้น'} ${Math.abs(d.yPct)}%`;
      const warn = Math.abs(d.xPct) > 10 || Math.abs(d.yPct) > 8 ? ' · หัวขยับมากกว่าปกติ ลองดริลยืนเท้าชิดหรือเช็กแนวยืน' : '';
      setPoseMsg(`เทียบกับ address: หัว${side}, ${up} (เทียบความสูงตัว) · ลำตัวเอียง ${m.spineDeg}° (${d.spineChange >= 0 ? '+' : ''}${d.spineChange}°)${warn}`);
    } catch {
      setPoseMsg('โหลดตัววิเคราะห์ท่าไม่ได้ ต้องต่ออินเทอร์เน็ตครั้งแรก และใช้ได้ในแอปที่ kasidito.github.io/swinglog เท่านั้น (ไม่ทำงานในหน้าพรีวิว)');
    } finally { setBusy(false); }
  };

  const save = () => {
    if (!flight) return;
    onLog(flight); setMsg(`บันทึก ${FLIGHT_LABEL[flight]} ลงเซสชันแล้ว`);
  };

  const flights = left ? [...ORDER].reverse() : ORDER;
  return (
    <>
      <div><p className="eyebrow">SwingLog</p><h1>ดูวงสวิง</h1></div>
      <input ref={camInput} type="file" accept="video/*" capture="environment" hidden onChange={(e) => pick(e.target.files?.[0])} />
      <input ref={fileInput} type="file" accept="video/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
      <div className="seg">
        <button type="button" className="btn btn-small" onClick={() => camInput.current?.click()}>ถ่ายวิดีโอ</button>
        <button type="button" className="btn btn-secondary" onClick={() => fileInput.current?.click()}>เลือกจากคลัง</button>
      </div>

      {!url && (
        <section className="card stack">
          <h2>วิธีถ่ายให้ดูง่าย</h2>
          <ul style={{ margin: 0, paddingLeft: '1.2em' }}>
            <li>วางมือถือนิ่งบนขาตั้งหรือพิงถุงกอล์ฟ ไม่ถือถ่าย</li>
            <li>ถ่ายจากด้านหลังตัวผู้ตี มองไปทางเป้า (down-the-line) เพื่อดูวิถีลูก หรือถ่ายจากด้านหน้าเพื่อดูท่าทาง</li>
            <li>ให้เห็นตัวเต็มตั้งแต่หัวถึงเท้า</li>
            <li>ใช้โหมดสโลว์โมชันของกล้องถ้ามี ดูได้ชัดกว่า</li>
          </ul>
          <p className="muted" style={{ margin: 0 }}>วิดีโอไม่ถูกส่งออกจากเครื่อง และไม่ถูกเก็บในแอป ปิดหน้านี้แล้ววิดีโอจะหายจากแอป (ยังอยู่ในคลังรูปของคุณ)</p>
        </section>
      )}

      {url && (
        <>
          <div style={{ position: 'relative', background: '#000', borderRadius: 14, overflow: 'hidden' }}>
            <video ref={video} src={url} playsInline muted preload="metadata" style={{ width: '100%', display: 'block', maxHeight: '70vh', objectFit: 'contain' }}
              onLoadedMetadata={(e) => { setDuration(e.currentTarget.duration); e.currentTarget.playbackRate = speed; sizeCanvas(); }}
              onLoadedData={sizeCanvas}
              onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
              onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
            <canvas ref={canvas} aria-label="ชั้นวาดเส้นบนวิดีโอ" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
              style={{ position: 'absolute', left: 0, top: 0, touchAction: 'none', pointerEvents: mode === 'view' ? 'none' : 'auto', cursor: mode === 'view' ? 'default' : 'crosshair' }} />
          </div>
          <input type="range" min={0} max={duration || 0} step={0.01} value={time} aria-label="ตำแหน่งในวิดีโอ"
            onChange={(e) => { const v = video.current; if (v) { v.pause(); v.currentTime = Number(e.target.value); } }} style={{ width: '100%', accentColor: 'var(--primary)' }} />
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <button type="button" className="btn btn-secondary" onClick={() => step(-STEP)} aria-label="ถอยหนึ่งเฟรม">-1 เฟรม</button>
            <button type="button" className="btn btn-small" onClick={toggle}>{playing ? 'หยุด' : 'เล่น'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => step(STEP)} aria-label="เดินหน้าหนึ่งเฟรม">+1 เฟรม</button>
          </div>
          <div className="row" role="group" aria-label="ความเร็ว">
            {[0.25, 0.5, 1].map((s) => <button key={s} type="button" className="chip" aria-pressed={speed === s} onClick={() => setSpeed(s)}>{s}x</button>)}
            <span className="spacer" /><span className="muted">{time.toFixed(2)} / {duration ? duration.toFixed(2) : '-'} วิ</span>
          </div>

          <section className="stack">
            <p className="q" style={{ margin: 0 }} id="tool-q">เครื่องมือ</p>
            <div className="row" role="group" aria-labelledby="tool-q">
              <button type="button" className="chip" aria-pressed={mode === 'line'} onClick={() => setMode(mode === 'line' ? 'view' : 'line')}>ลากเส้น</button>
              <button type="button" className="chip" aria-pressed={mode === 'trace'} onClick={() => { setTrace([]); setFlight(null); setMode('trace'); }}>วาดวิถีลูก</button>
              <button type="button" className="btn btn-ghost" onClick={() => { setLines([]); setTrace([]); setFlight(null); setMode('view'); }}>ล้างทั้งหมด</button>
            </div>
            {mode === 'line' && <p className="muted" style={{ margin: 0 }}>ลากนิ้วบนวิดีโอเพื่อวาดเส้น เช่น แนวหลัง แนวไม้ตอน address ตัวเลขคือองศาจากแนวนอน</p>}
            {mode === 'trace' && <p className="notice" style={{ margin: 0 }}>แตะ {['จุดที่ลูกออก', 'จุดสูงสุด', 'จุดที่ลูกตก'][trace.length]} ({trace.length + 1}/3) เลื่อนวิดีโอไปเฟรมที่เห็นลูกก่อนแตะได้</p>}
          </section>

          <section className="card stack">
            <h2>ท่าทาง (AI ประมาณการ)</h2>
            <p className="muted" style={{ margin: 0 }}>เลื่อนไปเฟรมตั้งท่า (address) แล้วกดตั้งเป็นจุดอ้างอิง จากนั้นเลื่อนไปเฟรมอื่น เช่น top หรือ impact แล้วกดตรวจ แอปจะเทียบการขยับของหัวและมุมลำตัว ถ่ายจากด้านหน้าจะเห็นการขยับซ้ายขวาชัดที่สุด</p>
            <div className="row">
              <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => analyzePose(true)}>ตั้งเป็น address</button>
              <button type="button" className="btn btn-small" disabled={busy} onClick={() => analyzePose(false)}>ตรวจท่าเฟรมนี้</button>
              {pose && <button type="button" className="btn btn-ghost" onClick={() => { setPose(null); setRef(null); setPoseMsg(''); }}>ล้าง</button>}
            </div>
            {poseMsg && <p className="muted" style={{ margin: 0 }} aria-live="polite">{poseMsg}</p>}
            <p className="muted" style={{ margin: 0 }}>วัดจากกล้องตัวเดียวแบบ 2 มิติ ไม่ได้ติดตามหัวไม้ ใช้ดูแนวโน้ม ไม่ใช่ตัวเลขแม่นยำ</p>
          </section>

          {trace.length === 3 && (
            <section className="card stack">
              <h2>ลูกนี้ไปทางไหน</h2>
              <p className="muted" style={{ margin: 0 }}>แอปเดาจากเส้นที่วาดว่าเป็น <strong>{flight ? FLIGHT_LABEL[flight] : '-'}</strong> (ประมาณ ใช้ได้กับวิดีโอที่ถ่ายจากด้านหลัง) แก้ได้ถ้าไม่ตรง</p>
              <div className="flights" role="group" aria-label="เลือกวิถีลูก">
                {flights.map((f) => (
                  <button key={f} type="button" className={`flight${flight === f ? ' flash' : ''}`} aria-pressed={flight === f} onClick={() => setFlight(f)}>{FLIGHT_LABEL[f]}</button>
                ))}
              </div>
              {canLog
                ? <button type="button" className="btn btn-small" onClick={save} disabled={!flight}>บันทึกลงเซสชัน</button>
                : <p className="muted" style={{ margin: 0 }}>เริ่มเซสชันในแท็บ ฝึก ก่อน ถ้าอยากบันทึกลูกนี้</p>}
            </section>
          )}
          {msg && <p className="muted" aria-live="polite">{msg}</p>}
        </>
      )}
    </>
  );
}
