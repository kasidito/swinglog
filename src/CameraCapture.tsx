import { useEffect, useMemo, useRef, useState } from 'react';
import { GUIDE_TIPS, View } from './guide';
import CameraGuide from './CameraGuide';
import { cameraInfo, captureGeometry, croppedStream, pickRecordingMime, type CaptureInfo, type CaptureMode } from './capture';

const MAX_SECONDS = 12;
type StopReason = NonNullable<CaptureInfo['stopReason']>;
export default function CameraCapture({ left, onCapture, onClose, onFallback, onImport }: {
  left: boolean; onCapture: (f: File, info: CaptureInfo) => void; onClose: () => void; onFallback: () => void; onImport: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null), stage = useRef<HTMLDivElement>(null), modal = useRef<HTMLDivElement>(null);
  const stream = useRef<MediaStream | null>(null), recorder = useRef<MediaRecorder | null>(null);
  const encoded = useRef<ReturnType<typeof croppedStream> | null>(null);
  const disposed = useRef(false), discard = useRef(false), started = useRef(0), timer = useRef<number>();
  const stopRef = useRef<(reason: StopReason) => void>(() => undefined), closeRef = useRef<() => void>(() => undefined);
  const [view, setView] = useState<View>('dtl'), [mode, setMode] = useState<CaptureMode>('portrait');
  const [pan, setPan] = useState(0.5), [source, setSource] = useState({ width: 0, height: 0 });
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const [error, setError] = useState(''), [recording, setRecording] = useState(false), [secs, setSecs] = useState(0);
  const [showTips, setShowTips] = useState(false), [saving, setSaving] = useState(false);
  const [showHuman, setShowHuman] = useState(true), [humanOpacity, setHumanOpacity] = useState(0.55);
  const geometry = useMemo(() => captureGeometry(source.width, source.height, mode, pan), [source, mode, pan]);
  const aspect = geometry ? geometry.width / geometry.height : 9 / 16;
  const cropped = !!geometry && (geometry.crop.width < source.width - 0.01 || geometry.crop.height < source.height - 0.01);
  const locked = recording || saving;

  const releaseEncoder = () => { window.clearInterval(timer.current); encoded.current?.close(); encoded.current = null; };
  const close = () => { discard.current = true; releaseEncoder(); const r = recorder.current; if (r && r.state !== 'inactive') r.stop(); onClose(); };
  closeRef.current = close;
  const updateSource = () => {
    const v = video.current;
    if (!v?.videoWidth || !v.videoHeight) return;
    if (recorder.current?.state === 'recording') {
      if (v.videoWidth !== source.width || v.videoHeight !== source.height) stopRef.current('source-changed');
    } else setSource({ width: v.videoWidth, height: v.videoHeight });
  };

  useEffect(() => {
    disposed.current = false; let cancelled = false;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, aspectRatio: { ideal: 9 / 16 }, width: { ideal: 1080 }, height: { ideal: 1920 }, frameRate: { ideal: 60 } }, audio: false });
        if (cancelled) { s.getTracks().forEach(t => t.stop()); return; }
        stream.current = s;
        s.getVideoTracks()[0]?.addEventListener('ended', () => {
          if (disposed.current) return;
          if (recorder.current?.state === 'recording') stopRef.current('camera-ended');
          else setError('กล้องหยุดส่งภาพ ใช้กล้องเครื่องหรือนำเข้าคลิปแทน');
        });
        if (video.current) { video.current.srcObject = s; await video.current.play(); }
      } catch { if (!cancelled) setError('เปิดกล้องไม่ได้ โปรดอนุญาตกล้อง หรือใช้กล้องเครื่อง/นำเข้าคลิป'); }
    })();
    const hide = () => { if (document.hidden) stopRef.current('background'); };
    document.addEventListener('visibilitychange', hide);
    return () => {
      cancelled = true; disposed.current = true; discard.current = true; releaseEncoder();
      const r = recorder.current;
      if (r) { r.onstop = null; r.ondataavailable = null; r.onerror = null; if (r.state !== 'inactive') r.stop(); }
      stream.current?.getTracks().forEach(t => t.stop()); document.removeEventListener('visibilitychange', hide);
    };
  }, []);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    modal.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); closeRef.current(); }
      if (e.key !== 'Tab') return;
      const nodes = Array.from(modal.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),[tabindex="0"]') ?? []).filter(el => el.getClientRects().length);
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); previous?.focus(); };
  }, []);

  useEffect(() => {
    const el = stage.current; if (!el) return;
    const fit = () => { const rect = el.getBoundingClientRect(); const h = Math.min(rect.height, rect.width / aspect); setBox({ w: Math.floor(h * aspect), h: Math.floor(h) }); };
    fit(); const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null; ro?.observe(el);
    window.addEventListener('resize', fit);
    return () => { ro?.disconnect(); window.removeEventListener('resize', fit); };
  }, [aspect, showTips, cropped]);

  const start = () => {
    const v = video.current, raw = stream.current, g = geometry;
    if (!v || !raw || !g || recorder.current?.state === 'recording' || saving) return;
    if (v.videoWidth !== g.sourceWidth || v.videoHeight !== g.sourceHeight) { updateSource(); return; }
    const mime = pickRecordingMime();
    if (mime === null) { setError('เครื่องนี้ไม่มีตัวบันทึกวิดีโอบนเว็บ ใช้กล้องเครื่องหรือนำเข้าคลิปแทน'); return; }
    try {
      discard.current = false;
      encoded.current = g.needsCanvas ? croppedStream(v, g, () => stopRef.current('source-changed')) : null;
      const r = new MediaRecorder(encoded.current?.stream ?? raw, mime ? { mimeType: mime } : undefined);
      const info = cameraInfo(g, mode, raw.getVideoTracks()[0]?.getSettings().frameRate);
      const chunks: Blob[] = []; let delivered = false;
      r.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      r.onstop = () => {
        releaseEncoder(); recorder.current = null;
        if (discard.current || disposed.current || delivered) return;
        delivered = true;
        const type = r.mimeType || mime || 'video/webm';
        const file = new File(chunks, `swing.${type.includes('mp4') ? 'mp4' : 'webm'}`, { type });
        if (!file.size) { setSaving(false); setRecording(false); setError('ยังไม่มีภาพในคลิป ลองอัดอีกครั้งหรือใช้กล้องเครื่อง'); return; }
        stream.current?.getTracks().forEach(t => t.stop());
        onCapture(file, info);
      };
      r.onerror = () => { discard.current = true; releaseEncoder(); if (r.state !== 'inactive') r.stop(); recorder.current = null; if (!disposed.current) { setRecording(false); setSaving(false); setError('ตัวบันทึกหยุดทำงาน ใช้ภาพเต็ม กล้องเครื่อง หรือนำเข้าคลิปแทน'); } };
      stopRef.current = reason => {
        if (r.state !== 'recording') return;
        info.stopReason = reason; window.clearInterval(timer.current); setRecording(false); setSaving(true); r.stop();
      };
      r.start(250); recorder.current = r; started.current = performance.now();
      setSecs(0); setRecording(true); setShowTips(false); setError('');
      timer.current = window.setInterval(() => { const elapsed = (performance.now() - started.current) / 1000; setSecs(Math.floor(elapsed)); if (elapsed >= MAX_SECONDS) stopRef.current('limit'); }, 250);
    } catch (e) {
      discard.current = true; releaseEncoder(); recorder.current = null; setRecording(false); setSaving(false);
      setError(e instanceof Error && e.message.includes('เครื่องนี้') ? e.message : 'อัดตามกรอบไม่ได้บนเครื่องนี้ เลือกภาพเต็ม ใช้กล้องเครื่อง หรือนำเข้าคลิป');
    }
  };
  return <div ref={modal} className="cam portrait-camera" role="dialog" aria-modal="true" aria-label="กล้องพร้อมกรอบจัดตำแหน่ง">
    <div className="cam-top">
      <button type="button" className="cam-btn" onClick={close}>ปิด</button>
      <div className="cam-seg" role="group" aria-label="มุมกล้อง">
        <button type="button" aria-pressed={view === 'dtl'} onClick={() => setView('dtl')} disabled={locked}>ด้านหลัง</button>
        <button type="button" aria-pressed={view === 'faceon'} onClick={() => setView('faceon')} disabled={locked}>ด้านหน้า</button>
      </div>
      <button type="button" className="cam-btn" aria-expanded={showTips} onClick={() => setShowTips(x => !x)}>วิธีตั้ง</button>
    </div>
    <div className="cam-format" role="group" aria-label="กรอบที่บันทึก">
      <button type="button" aria-pressed={mode === 'portrait'} disabled={locked} onClick={() => { setMode('portrait'); if (stream.current) setError(''); }}>แนวตั้ง 9:16</button>
      <button type="button" aria-pressed={mode === 'native'} disabled={locked} onClick={() => { setMode('native'); if (stream.current) setError(''); }}>ภาพเต็มจากกล้อง</button>
    </div>
    <p className="cam-status" role="status">{saving ? 'กำลังเตรียมคลิป…' : error || (geometry ? `${cropped ? 'ตัดด้านข้าง/ขอบภาพตามกรอบ · ' : ''}บันทึก ${geometry.width} × ${geometry.height}${geometry.needsCanvas ? ' · ผ่านกรอบ 30 FPS ที่ร้องขอ' : ' · ตามสัดส่วนที่เลือก'}` : 'กำลังเปิดกล้อง…')}</p>
    {showTips && <div className="cam-instructions"><strong>{view === 'dtl' ? 'ดูสวิงจากด้านหลัง' : 'ดูสวิงจากด้านหน้า'}</strong><ul>{GUIDE_TIPS[view].map(t => <li key={t}>{t}</li>)}</ul><p>ขยับกล้องให้ตัวจริงมีขนาดใกล้ภาพคน เห็นเท้าและไม้ครบ ไม่ต้องทาบทุกส่วนให้ตรง ภาพตัวอย่างใช้เหล็กกลาง ตำแหน่งลูกและท่าจริงปรับตามไม้และสัดส่วนของคุณ ภาพ AI นี้ใช้จัดเฟรม ไม่ใช่การตรวจท่า</p><p>นี่คือโหมดถ่ายสวิงเต็มตัว ไม่ใช่กล้องวัดความเร็วลูก ไม่มีการรับประกัน FPS จริง</p></div>}
    <div className="cam-stage" ref={stage}>
      <div className="cam-frame" data-capture-mode={mode} data-cropped={cropped} style={box ? { width: box.w, height: box.h } : undefined}>
        <video ref={video} playsInline muted autoPlay onLoadedMetadata={updateSource} onResize={updateSource} style={{ objectPosition: `${pan * 100}% ${pan * 100}%` }} />
        {geometry && !error && <CameraGuide key={view} view={view} left={left} aspect={aspect} visible={showHuman} opacity={humanOpacity} compact={(box?.h ?? 500) < 300} />}
        {recording && <span className="cam-rec" role="status">REC {secs}/{MAX_SECONDS} วิ</span>}
      </div>
    </div>
    <div className="cam-human-controls">
      <button type="button" className="cam-btn" aria-pressed={showHuman} onClick={() => setShowHuman(x => !x)}>{showHuman ? 'ซ่อนภาพคน' : 'แสดงภาพคน'}</button>
      <label>ความชัด<input type="range" aria-label="ความชัดของภาพคน" min="0.2" max="0.8" step="0.05" value={humanOpacity} disabled={!showHuman} onChange={e => setHumanOpacity(Number(e.target.value))} /></label>
    </div>
    {cropped && <label className="cam-pan">เลื่อนกรอบ{geometry!.crop.width < source.width - 0.01 ? 'ซ้าย–ขวา' : 'บน–ล่าง'}<input type="range" min="0" max="1" step="0.01" value={pan} disabled={locked} onChange={e => setPan(Number(e.target.value))} /></label>}
    <div className="cam-bottom">
      <button type="button" className="cam-btn" disabled={locked} onClick={onFallback}>กล้องเครื่อง</button>
      <button type="button" className={`cam-shutter${recording ? ' on' : ''}`} disabled={!geometry || !!error || saving} onClick={recording ? () => stopRef.current('user') : start} aria-label={recording ? 'หยุดอัด' : 'เริ่มอัด'} />
      <button type="button" className="cam-btn" disabled={locked} onClick={onImport}>นำเข้าคลิป</button>
    </div>
  </div>;
}
