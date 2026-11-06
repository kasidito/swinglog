import { useEffect, useRef, useState } from 'react';
import { GUIDE_TIPS, View, guideLayout } from './guide';

const MAX_SECONDS = 12;
// The guide is drawn for a portrait 9:16 frame. Some phones (iPhone Safari) hand back a landscape stream
// even when held upright, so the preview is cropped to 9:16 and the recording is cropped the same way.
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
  const aspect = FRAME;
  const stage = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const raf = useRef(0);
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
    return () => { cancelled = true; cancelAnimationFrame(raf.current); stream.current?.getTracks().forEach((t) => t.stop()); };
  }, []);

  // Fit a 9:16 frame inside the stage, whatever the screen size.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const fit = () => {
      const { width, height } = el.getBoundingClientRect();
      const h = Math.min(height, width / FRAME);
      setBox({ w: Math.floor(h * FRAME), h: Math.floor(h) });
    };
    fit();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
    ro?.observe(el);
    window.addEventListener('resize', fit);
    return () => { ro?.disconnect(); window.removeEventListener('resize', fit); };
  }, []);

  /** A stream whose picture matches the 9:16 guide: the camera stream itself if it is already portrait,
   *  otherwise a centre crop drawn onto a canvas. */
  const recordSource = (): MediaStream => {
    const v = video.current, src = stream.current!;
    if (!v || !v.videoWidth || !v.videoHeight) return src;
    const vw = v.videoWidth, vh = v.videoHeight;
    if (Math.abs(vw / vh - FRAME) < 0.02) return src;
    const canvas = document.createElement('canvas');
    if (typeof canvas.captureStream !== 'function') return src;
    const sh = vw / vh > FRAME ? vh : vw / FRAME;
    const sw = sh * FRAME;
    const sx = (vw - sw) / 2, sy = (vh - sh) / 2;
    const k = Math.min(1, 1280 / sh); // keep the canvas light enough for 60 fps on a phone
    canvas.width = Math.round((sw * k) / 2) * 2; canvas.height = Math.round((sh * k) / 2) * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return src;
    const draw = () => { ctx.drawImage(v, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height); raf.current = requestAnimationFrame(draw); };
    draw();
    return canvas.captureStream(60);
  };

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
      const r = new MediaRecorder(recordSource(), mime ? { mimeType: mime } : undefined);
      chunks.current = [];
      r.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
      r.onstop = () => {
        const type = r.mimeType || mime || 'video/webm';
        const file = new File(chunks.current, `swing.${type.includes('mp4') ? 'mp4' : 'webm'}`, { type });
        cancelAnimationFrame(raf.current);
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
          <video ref={video} playsInline muted autoPlay />
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
          <span>จัดให้ตัวอยู่ในกรอบเส้นประ มืออยู่ที่กากบาท ลูกอยู่ที่วงกลม</span>
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
