import { useEffect, useRef, useState, type RefObject } from 'react';
import { PHASES, closestPose, comparePose, correctedRun, findBall, makeReport, phaseOrderValid, reliablePose, samplingTimes, validTime, type BallRun, type ClipInfo, type Phase, type PhaseMarks, type PoseSample } from './analysis';
import { BONES } from './pose';
import { createPoseWorker, ensureActive, grayscale, sampleVideo } from './video-processing';
import ShotMetrics from './ShotMetrics';
import { poseMetricResults } from './metrics';

const LABEL: Record<Phase, string> = { address: 'Address', top: 'Top', impact: 'Impact', finish: 'Finish' };
export default function VideoLab({ url, clip, video, time, left }: { url: string; clip: ClipInfo; video: RefObject<HTMLVideoElement>; time: number; left: boolean }) {
  const [view, setView] = useState<'faceon' | 'dtl'>('faceon');
  const [marks, setMarks] = useState<PhaseMarks>({});
  const [start, setStart] = useState(0), [end, setEnd] = useState(Math.min(10, clip.duration));
  const [poses, setPoses] = useState<PoseSample[]>([]), [ball, setBall] = useState<BallRun | null>(null);
  const [cursor, setCursor] = useState({ x: 0.5, y: 0.5 });
  const [pointMode, setPointMode] = useState(false), [busy, setBusy] = useState(false);
  const [runState, setRunState] = useState<'idle' | 'running' | 'completed' | 'partial' | 'cancelled' | 'unavailable'>('idle');
  const [status, setStatus] = useState('ยังไม่ได้วิเคราะห์'), [progress, setProgress] = useState(0);
  const [kind, setKind] = useState<'pose' | 'ball' | null>(null);
  const abort = useRef<AbortController | null>(null), proof = useRef<HTMLCanvasElement>(null);
  const currentRun = useRef(0), mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; currentRun.current++; abort.current?.abort(); }; }, []);
  useEffect(() => { if (pointMode) proof.current?.focus(); }, [pointMode]);
  const validClip = validTime(0, clip.duration) && clip.width > 0 && clip.height > 0;
  const rangeOK = validTime(start, clip.duration) && validTime(end, clip.duration) && end > start && end - start <= 10;
  const comparable = comparePose(poses, marks, clip.width, clip.height);
  const nearest = closestPose(poses, time);
  useEffect(() => {
    const c = proof.current, v = video.current; if (!c || !v || v.readyState < 2) return;
    const scale = Math.min(1, 640 / Math.max(clip.width, clip.height));
    c.width = Math.round(clip.width * scale); c.height = Math.round(clip.height * scale);
    const ctx = c.getContext('2d'); if (!ctx) return;
    ctx.drawImage(v, 0, 0, c.width, c.height);
    const lm = nearest?.landmarks;
    if (reliablePose(lm ?? null)) {
      ctx.strokeStyle = '#79d2ff'; ctx.lineWidth = 2;
      for (const [a, b] of BONES) {
        if ((lm![a].visibility ?? 0) < 0.5 || (lm![b].visibility ?? 0) < 0.5) continue;
        ctx.beginPath(); ctx.moveTo(lm![a].x * c.width, lm![a].y * c.height); ctx.lineTo(lm![b].x * c.width, lm![b].y * c.height); ctx.stroke();
      }
    }
    if (pointMode) {
      const x = cursor.x * c.width, y = cursor.y * c.height;
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.lineTo(x + 8, y); ctx.moveTo(x, y - 8); ctx.lineTo(x, y + 8); ctx.stroke();
    }
    const points = ball?.points.filter(p => p.time <= time + 0.04) ?? [];
    // Only observed/manual endpoints; the line between samples is interpolation.
    ctx.strokeStyle = '#f5c451'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.beginPath();
    points.forEach((p, i) => { if (!i) ctx.moveTo(p.x * c.width, p.y * c.height); else ctx.lineTo(p.x * c.width, p.y * c.height); }); ctx.stroke(); ctx.setLineDash([]);
    for (const p of points) {
      ctx.fillStyle = p.source === 'manual' ? '#79d2ff' : '#f5c451'; ctx.beginPath(); ctx.arc(p.x * c.width, p.y * c.height, 4, 0, Math.PI * 2); ctx.fill();
    }
  }, [time, clip, poses, ball, nearest, video, pointMode, cursor]);

  const mark = (phase: Phase) => {
    const t = video.current?.currentTime ?? time; video.current?.pause();
    if (!validTime(t, clip.duration)) return;
    const next = { ...marks, [phase]: t };
    if (!phaseOrderValid(next)) { setStatus('ลำดับต้องเป็น Address ก่อน Top ก่อน Impact ก่อน Finish ลบจุดเดิมที่ไม่ตรงแล้วกำหนดใหม่'); return; }
    setMarks(next); setStatus(`กำหนด ${LABEL[phase]} ที่ ${t.toFixed(3)} วินาทีแล้ว`);
  };
  const seek = (t: number) => { const v = video.current; if (v && !busy) { v.pause(); v.currentTime = t; } };
  const commitPoint = (position: { x: number; y: number }) => {
    if (!pointMode || busy) return;
    video.current?.pause(); const t = video.current?.currentTime ?? time;
    if (!validTime(t, clip.duration)) return;
    const p = { ...position, time: t, source: 'manual' as const };
    if (ball?.points.length && t < ball.points[0].time - 0.001) { setStatus('จุดแก้ไขต้องไม่อยู่ก่อนจุดเริ่มติดตาม ล้างจุดลูกเพื่อเริ่มใหม่'); return; }
    setRunState('idle'); setProgress(0);
    setBall(correctedRun(ball ?? { points: [], stoppedAt: null, reason: '' }, p)); setPointMode(false);
    setStatus('กำหนดจุดลูกแล้ว ผลติดตามหลังจุดนี้ถูกล้าง กดติดตามต่อเพื่อคำนวณใหม่');
  };
  const pickPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const r = event.currentTarget.getBoundingClientRect();
    commitPoint({ x: Math.min(1, Math.max(0, (event.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (event.clientY - r.top) / r.height)) });
  };
  const keyPoint = (event: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (!pointMode || busy) return;
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); commitPoint(cursor); return; }
    if (event.key === 'Escape') { setPointMode(false); return; }
    if (!event.key.startsWith('Arrow')) return;
    event.preventDefault();
    const step = event.shiftKey ? 10 : 1;
    setCursor(p => ({
      x: Math.min(1, Math.max(0, p.x + (event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0) / (proof.current?.width || 640))),
      y: Math.min(1, Math.max(0, p.y + (event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0) / (proof.current?.height || 360))),
    }));
  };
  const run = async (type: 'pose' | 'ball') => {
    if (busy || abort.current || !rangeOK) return;
    const seed = ball?.points[ball.points.length - 1];
    if (type === 'ball' && marks.impact === undefined) { setStatus('กำหนดเฟรม Impact ก่อนเริ่มติดตามลูก'); return; }
    if (type === 'ball' && (!seed || seed.time < start || seed.time < marks.impact! || seed.time >= end)) { setStatus('จุดลูกต้องอยู่ในช่วงวิเคราะห์ ไม่ก่อน Impact และอยู่ก่อนเวลาสิ้นสุด'); return; }
    const id = ++currentRun.current, controller = new AbortController(); abort.current = controller;
    const alive = () => mounted.current && currentRun.current === id;
    setBusy(true); setRunState('running'); setKind(type); setProgress(0); setPointMode(false); video.current?.pause();
    setStatus(type === 'pose' ? 'กำลังวิเคราะห์ลำดับภาพ ครั้งแรกต้องดาวน์โหลดโมเดล' : 'กำลังติดตามวัตถุสว่างจากจุดที่เลือก ตรวจผลทุกครั้ง');
    let worker: ReturnType<typeof createPoseWorker> | undefined;
    try {
      if (type === 'pose') {
        worker = createPoseWorker(controller.signal); const samples: PoseSample[] = [];
        const times = [...new Set([...samplingTimes(start, end, 12, 120), ...Object.values(marks).filter(t => t !== undefined && t >= start && t <= end)])].sort((a, b) => a - b);
        setPoses([]);
        await sampleVideo(url, times, controller.signal, async (canvas, t, i) => {
          const landmarks = await worker!.detect(canvas); ensureActive(controller.signal);
          samples.push({ time: t, landmarks: reliablePose(landmarks) ? landmarks : null });
          if (alive()) { setPoses([...samples]); setProgress(Math.round((i + 1) / times.length * 100)); }
        });
        const good = samples.filter(s => s.landmarks).length;
        if (alive()) setRunState(good === 0 ? 'unavailable' : good < samples.length ? 'partial' : 'completed');
        if (alive()) setStatus(good === 0 ? 'วิเคราะห์ท่าไม่ได้ ไม่พบข้อต่อที่ชัดพอ ใช้การกำหนดช่วงหรือวาดเส้นด้วยมือ' : `วิเคราะห์${good < samples.length ? 'ได้บางส่วน' : 'สำเร็จ'}: ใช้ได้ ${good}/${samples.length} ภาพตัวอย่าง ไม่ใช่ทุกเฟรมของคลิป`);
      } else {
        const times = samplingTimes(seed!.time, end, 30, 120);
        const points = ball!.points.filter(p => p.time <= seed!.time); let previous: Uint8Array | null = null;
        let stopped = false, stoppedAt: number | null = null, repeated = 0;
        await sampleVideo(url, times, controller.signal, async (canvas, t, i) => {
          if (stopped) return false;
          const gray = grayscale(canvas);
          if (previous && gray.every((v, i) => v === previous![i]) && ++repeated <= 2) {
            if (alive()) setProgress(Math.round((i + 1) / times.length * 100));
            return; // Repeated decoded frame: no invented observation or velocity.
          }
          if (previous) {
            const last = points[points.length - 1];
            const before = points.length > 1 && last.source !== 'manual' ? points[points.length - 2] : null;
            const found = findBall(previous, gray, canvas.width, canvas.height, last, before);
            if (!found) { stopped = true; stoppedAt = t; }
            else points.push({ ...found, time: t, source: 'detected' });
          }
          previous = gray; repeated = 0;
          if (alive()) { setBall({ points: [...points], stoppedAt, reason: stopped ? 'ไม่พบลูกที่แยกจากฉากหลังได้ชัด หรือมีวัตถุคล้ายกัน' : '' }); setProgress(Math.round((i + 1) / times.length * 100)); }
          return !stopped;
        });
        if (points.length === 1 && !stopped) { stopped = true; stoppedAt = seed!.time; if (alive()) setBall({ points, stoppedAt, reason: 'ไม่พบการเคลื่อนของลูกที่ตรวจสอบได้' }); }
        if (alive()) setRunState(stopped ? 'partial' : 'completed');
        if (alive()) setStatus(stopped ? 'ติดตามได้บางส่วนและหยุดแล้ว เลื่อนไปเวลาที่หลุดแล้วแตะแก้จุด ห้ามตีความเส้นเป็นระยะจริง' : 'ประมวลผลครบช่วงที่เลือกแล้ว ตรวจว่าจุดสีเหลืองตามลูกจริง ไม่ใช่วัตถุอื่น');
      }
    } catch (e) {
      if (alive()) setRunState(controller.signal.aborted ? 'cancelled' : 'unavailable');
      if (alive()) setStatus(controller.signal.aborted ? 'ยกเลิกแล้ว เก็บผลบางส่วนไว้ให้ตรวจหรือส่งออกได้' : e instanceof Error ? e.message : 'วิเคราะห์ไม่สำเร็จ ใช้เครื่องมือด้วยมือได้');
    } finally { worker?.close(); if (alive()) { setBusy(false); abort.current = null; } }
  };
  const exportResult = () => {
    const report = makeReport(clip, view, left, marks, poses, ball);
    const blob = new Blob([JSON.stringify({ ...report, selectedRange: { start, end }, run: { kind, state: runState, status, progress, busy: false } }, null, 2)], { type: 'application/json' });
    const href = URL.createObjectURL(blob), a = document.createElement('a'); a.href = href; a.download = 'swinglog-analysis.json'; a.click(); window.setTimeout(() => URL.revokeObjectURL(href), 1000);
  };
  return <section className="analysis-lab stack" data-run-state={runState} aria-busy={busy} aria-labelledby="analysis-title">
    <h2 id="analysis-title">ทดลองวิเคราะห์สวิงและลูก</h2>
    <p className="muted">ประมวลผลในเครื่อง ผลเป็นค่าประมาณ 2D ไม่ใช่การวินิจฉัยสวิง ไม่วัดระยะ ความเร็ว หรือสปิน</p>
    {!validClip ? <p role="alert">ยังอ่านข้อมูลคลิปไม่ได้ เลือกวิดีโอที่เบราว์เซอร์เปิดได้</p> : <>
      <p className="analysis-meta">{clip.width} × {clip.height} · {clip.duration.toFixed(2)} วินาที · {(clip.bytes / 1048576).toFixed(1)} MB · ไม่ทราบ FPS ต้นฉบับ</p>
      <fieldset disabled={busy}><legend>มุมกล้อง</legend><div className="row">
        <button type="button" className="chip" aria-pressed={view === 'faceon'} onClick={() => setView('faceon')}>ด้านหน้า (Face-on)</button>
        <button type="button" className="chip" aria-pressed={view === 'dtl'} onClick={() => setView('dtl')}>ตามแนวตี (DTL)</button>
      </div></fieldset>
      <p className="muted">{view === 'faceon' ? 'เห็นตัวเต็มและตั้งกล้องนิ่ง ใช้ดูการเคลื่อนในภาพ ไม่ใช้ตัดสินการหมุน 3D' : 'เห็นตัวเต็มสำหรับสวิง หากติดตามลูกให้เหลือพื้นที่ด้านเป้าและท้องฟ้า อาจต้องถ่ายแยกคลิป'}</p>
      <fieldset disabled={busy}><legend>ช่วงวิเคราะห์ ไม่เกิน 10 วินาที</legend><div className="analysis-range">
        <label>เริ่ม (วินาที)<input type="number" min="0" max={clip.duration} step="0.01" value={Number.isFinite(start) ? start : ''} onChange={e => setStart(e.target.valueAsNumber)} /></label>
        <label>สิ้นสุด (วินาที)<input type="number" min="0" max={clip.duration} step="0.01" value={Number.isFinite(end) ? end : ''} onChange={e => setEnd(e.target.valueAsNumber)} /></label>
      </div></fieldset>
      {!rangeOK && <p role="alert">เลือกเวลาเริ่มและสิ้นสุดภายในคลิป โดยสิ้นสุดหลังเริ่มและห่างไม่เกิน 10 วินาที</p>}
      <p className="muted">เวลาเป็นไทม์ไลน์ของไฟล์และการ seek โดยประมาณ คลิปสโลว์อาจไม่ตรงกับเวลาถ่ายจริง</p>
      <h3>กำหนดช่วงสวิงด้วยมือ</h3>
      <ul className="analysis-marks">{PHASES.map(p => <li key={p}><span>{LABEL[p]} {marks[p] === undefined ? 'ยังไม่กำหนด' : `${marks[p]!.toFixed(3)} วิ`}</span><div className="row">
        <button type="button" className="btn btn-small" disabled={busy} onClick={() => mark(p)}>ตั้ง {LABEL[p]} ตรงนี้</button>
        <button type="button" className="btn btn-ghost" disabled={busy || marks[p] === undefined} onClick={() => seek(marks[p]!)}>ดู {LABEL[p]}</button>
        <button type="button" className="btn btn-ghost" disabled={busy || marks[p] === undefined} onClick={() => { const next = { ...marks }; delete next[p]; setMarks(next); }}>ลบ {LABEL[p]}</button>
      </div></li>)}</ul>
      <div className="row"><button type="button" className="btn btn-primary" disabled={busy || !rangeOK} onClick={() => run('pose')}>วิเคราะห์สวิงทั้งช่วง</button>
        {busy && <button type="button" className="btn btn-secondary" onClick={() => abort.current?.abort()}>ยกเลิกการวิเคราะห์</button>}
      </div>
      <p role="status" aria-live="polite">{status}</p>
      {busy && <progress aria-label="ความคืบหน้าการวิเคราะห์" max="100" value={progress} />}
      <h3>เฟรมหลักฐาน ณ {time.toFixed(3)} วินาที</h3>
      <canvas ref={proof} className={`analysis-proof${pointMode ? ' picking' : ''}`} onPointerDown={pickPoint} onKeyDown={keyPoint} tabIndex={pointMode ? 0 : -1} aria-describedby={pointMode ? "point-help" : undefined} aria-label="เฟรมหลักฐานและจุดลูก แตะเมื่อเปิดโหมดเลือกจุด" />
      <p className="muted">ฟ้า: โครงท่าหรือจุดลูกที่กำหนดด้วยมือ · เหลือง: ตำแหน่งวัตถุที่ตรวจพบ · เส้นประ: เส้นเชื่อมประมาณระหว่างตัวอย่าง ไม่ใช่ตำแหน่งที่ตรวจครบทุกเฟรม</p>
      {pointMode && <p id="point-help" className="notice">กำหนด Impact ก่อนเริ่มติดตาม หยุดที่เฟรมที่เห็นลูก แล้วแตะกลางลูกในเฟรมหลักฐานด้านบน หรือใช้ปุ่มลูกศรขยับกากบาท (Shift เพื่อขยับเร็ว) แล้วกด Enter ยืนยัน หรือ Escape ยกเลิก</p>}
      <div className="row">
        <button type="button" className="btn btn-secondary" aria-pressed={pointMode} disabled={busy} onClick={() => { video.current?.pause(); setPointMode(!pointMode); }}>กำหนด / แก้จุดลูก</button>
        <button type="button" className="btn btn-small" disabled={busy || !rangeOK || !ball?.points.length || marks.impact === undefined} onClick={() => run('ball')}>ติดตามลูกต่อจากจุดล่าสุด</button>
        <button type="button" className="btn btn-ghost" disabled={busy || !ball} onClick={() => setBall(null)}>ล้างจุดลูก</button>
      </div>
      {ball && <><p>จุดลูก {ball.points.length} จุด {ball.stoppedAt !== null ? `· หลุดที่ ${ball.stoppedAt.toFixed(3)} วิ` : ''}</p>{ball.stoppedAt !== null && <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => seek(ball.stoppedAt!)}>ดูเฟรมที่ติดตามหลุด</button>}<p className="muted">{ball.reason || 'ตัวติดตามทดลองหาเพียงวัตถุสว่างขนาดเล็ก อาจตามลูกผิด ไม่ควรใช้เป็นผลวัดอัตโนมัติ'}</p></>}
      <h3>เทียบกับ Address</h3>
      {comparable.length ? <div>{comparable.map(m => <section key={m.phase}><h3>{LABEL[m.phase]} · {m.time.toFixed(2)} วิ</h3><ShotMetrics metrics={poseMetricResults(m)} /></section>)}</div> : <p className="muted">กำหนด Address และจุดอื่นในช่วงวิเคราะห์ แล้วประมวลผลสวิงใหม่ ผลจะแสดงเมื่อข้อต่อในเฟรมอ้างอิงและเฟรมเปรียบเทียบชัดพอ</p>}
      <div className="row"><button type="button" className="btn btn-secondary" disabled={busy || (!poses.length && !ball && !Object.keys(marks).length)} onClick={exportResult}>ส่งออกผลวิเคราะห์ JSON</button>
        <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => { setMarks({}); setPoses([]); setBall(null); setPointMode(false); setStatus('ล้างผลทดลองแล้ว'); setKind(null); setRunState('idle'); setProgress(0); }}>ล้างผลทดลอง</button></div>
      <p className="muted">ผลอยู่ในหน้านี้เท่านั้น เปลี่ยนคลิปหรือออกจากหน้าวิดีโอแล้วผลหาย ส่งออกไว้ก่อน ไม่มีการแก้ประวัติซ้อมเดิม</p>
    </>}
  </section>;
}
