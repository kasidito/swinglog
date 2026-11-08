import { useEffect, useRef, useState } from 'react';
import { GUIDE_TIPS, View, guideLayout } from './guide';

const MAX_SECONDS = 12;
// Start with a portrait guide; once metadata arrives, fit the native camera aspect ratio.
const FRAME = 9 / 16;

function pickMime() {
  if (typeof MediaRecorder === 'undefined') return '';
  for (const t of ['video/mp4', 'video/webm;codecs=vp9', 'video/webm']) if (MediaRecorder.isTypeSupported?.(t)) return t;
  return '';
}

export default function CameraCapture({ left, onCapture, onClose, onFallback }: {
  left: boolean; onCapture: (f: File) => void; onClose: () => void; onFallback: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [view, setView] = useState<View>('dtl');
  const [aspect, setAspect] = useState(FRAME);
  const stage = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const [error, setError] = useState('');
  const [recording, setRecording] = useState(false);
  const [secs, setSecs] = useState(0);
  const [showTips, setShowTips] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1080 }, height: { ideal: 1920 }, frameRate: { ideal: 60 } },
          audio: false,
        });
        if (cancelled) { s.getTracks().forEach((t) => t.stop()); return; }
        stream.current = s;
        if (video.current) { video.current.srcObject = s; await video.current.play().catch(() => undefined); }
      } catch {
        setError('เปิดกล้องในแอปไม่ได้ (อาจยังไม่ได้อนุญาตให้ใช้กล้อง) ใช้กล้องของเครื่องแทนได้');
      }
    })();
    return () => { cancelled = true; stream.current?.getTracks().forEach((t) => t.stop()); };
  }, []);

  // Fit the entire native camera picture inside the stage.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const fit = () => {
      const { width, height } = el.getBoundingClientRect();
      const h = Math.min(height, width / aspect);
      setBox({ w: Math.floor(h * aspect), h: Math.floor(h) });
    };
    fit();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
    ro?.observe(el);
    window.addEventListener('resize', fit);
    return () => { ro?.disconnect(); window.removeEventListener('resize', fit); };
  }, [aspect]);

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setSecs((s) => {
      if (s + 1 >= MAX_SECONDS) stop();
      return s + 1;
    }), 1000);
    return () => clearInterval(t);
  }, [recording]);

  const start = () => {
    if (!stream.current) return;
    const mime = pickMime();
    try {
      const r = new MediaRecorder(stream.current, mime ? { mimeType: mime } : undefined);
      chunks.current = [];
      r.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
      r.onstop = () => {
        const type = r.mimeType || mime || 'video/webm';
        const file = new File(chunks.current, `swing.${type.includes('mp4') ? 'mp4' : 'webm'}`, { type });
        stream.current?.getTracks().forEach((t) => t.stop());
        onCapture(file);
      };
      r.start(250);
      recorder.current = r;
      setSecs(0); setRecording(true); setShowTips(false);
    } catch {
      setError('อัดวิดีโอในแอปไม่ได้บนเครื่องนี้ ใช้กล้องของเครื่องแทนได้');
    }
  };
  const stop = () => {
    if (recorder.current && recorder.current.state !== 'inactive') recorder.current.stop();
    setRecording(false);
  };

  const g = guideLayout(view, left);
  const pct = (v: number) => `${v * 100}%`;
  const label = (text: string, x: number, y: number) => (
    <span className="cam-label" style={{ left: pct(x), top: pct(y) }}>{text}</span>
  );

  return (
    <div className="cam" role="dialog" aria-modal="true" aria-label="กล้องพร้อมกรอบจัดตำแหน่ง">
      <div className="cam-top">
        <button type="button" className="cam-btn" onClick={() => { stop(); onClose(); }}>ปิด</button>
        <div className="cam-seg" role="group" aria-label="มุมกล้อง">
          <button type="button" aria-pressed={view === 'dtl'} onClick={() => setView('dtl')} disabled={recording}>ด้านหลัง</button>
          <button type="button" aria-pressed={view === 'faceon'} onClick={() => setView('faceon')} disabled={recording}>ด้านหน้า</button>
        </div>
        <button type="button" className="cam-btn" aria-expanded={showTips} onClick={() => setShowTips((v) => !v)}>วิธีตั้ง</button>
      </div>

      <div className="cam-stage" ref={stage}>
        <div className="cam-frame" style={box ? { width: box.w, height: box.h } : undefined}>
          <video ref={video} playsInline muted autoPlay onLoadedMetadata={(e) => { const v = e.currentTarget; if (v.videoWidth && v.videoHeight) setAspect(v.videoWidth / v.videoHeight); }} />
          {!error && (
            <>
              <svg className="cam-guide" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <rect x={g.body.x * 100} y={g.body.y * 100} width={g.body.w * 100} height={g.body.h * 100} rx="3" className="g-zone" />
                <ellipse cx={g.head.x * 100} cy={g.head.y * 100} rx={g.head.r * 100} ry={g.head.r * 100 * aspect} className="g-line" />
                <line x1="4" x2="96" y1={g.feetY * 100} y2={g.feetY * 100} className="g-line" />
                <line x1="50" x2="50" y1={g.hands.y * 100 - 3} y2={g.hands.y * 100 + 3} className="g-hands" />
                <line x1={g.hands.x * 100 - 5} x2={g.hands.x * 100 + 5} y1={g.hands.y * 100} y2={g.hands.y * 100} className="g-hands" />
                <ellipse cx={g.ball.x * 100} cy={g.ball.y * 100} rx="1.8" ry={1.8 * aspect} className="g-ball" />
                {g.target && <line x1={g.target.x1 * 100} y1={g.target.y1 * 100} x2={g.target.x2 * 100} y2={g.target.y2 * 100} className="g-target" />}
                <line x1="0" x2="100" y1="12" y2="12" className="g-top" />
              </svg>
              {label('หัว', g.head.x, g.head.y - g.head.r - 0.035)}
              {label('มือตรงนี้', g.hands.x + 0.09, g.hands.y - 0.015)}
              {label('ลูก', g.ball.x, g.ball.y + 0.035)}
              {label('ปลายเท้า', 0.12, g.feetY - 0.035)}
              {label('เหลือที่ให้ไม้ตอน top', 0.5, 0.075)}
              {g.target && label('ทางเป้า', view === 'dtl' ? g.target.x2 + (left ? -0.08 : 0.08) : (g.target.x1 + g.target.x2) / 2, view === 'dtl' ? g.target.y2 + 0.03 : g.target.y1 - 0.035)}
            </>
          )}
          {recording && <span className="cam-rec">REC {secs}/{MAX_SECONDS} วิ</span>}
        </div>
      </div>

      {showTips && !error && (
        <div className="cam-tips">
          <strong>{view === 'dtl' ? 'ถ่ายจากด้านหลัง (ดูวิถีลูกและระนาบสวิง)' : 'ถ่ายจากด้านหน้า (ดูการถ่ายน้ำหนักและหัว)'}</strong>
          <ul>{GUIDE_TIPS[view].map((t) => <li key={t}>{t}</li>)}</ul>
          <span>จัดให้ตัวอยู่ในกรอบเส้นประ มืออยู่ที่กากบาท ลูกอยู่ที่วงกลม บันทึกภาพเต็มตามสัดส่วนกล้องโดยไม่ครอป และไม่รับประกัน 60 FPS</span>
        </div>
      )}
      {error && (
        <div className="cam-tips">
          <strong>{error}</strong>
          <button type="button" className="btn btn-small" onClick={onFallback}>ใช้กล้องของเครื่อง</button>
        </div>
      )}

      <div className="cam-bottom">
        {!error && (
          <button type="button" className={`cam-shutter${recording ? ' on' : ''}`} onClick={recording ? stop : start}
            aria-label={recording ? 'หยุดอัด' : 'เริ่มอัด'} />
        )}
      </div>
    </div>
  );
}
