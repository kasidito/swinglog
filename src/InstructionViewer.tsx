import { useEffect, useRef, useState } from 'react';
import { handTerms, imageUrl, Lesson, mirrorImage, targetDirection, targetLabel } from './coaching';
import GuideIcon from './GuideIcon';

export function CoachingImage({ id, frame = 0, left = false, alt, className = '' }: { id: string; frame?: number; left?: boolean; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setFailed(false); setLoaded(false); }, [id]);
  const mirrored = mirrorImage(id, left);
  return <div className={`coaching-photo ${className}`} data-mirrored={mirrored} aria-busy={!loaded && !failed}>
    {failed ? <p className="media-fallback" role="status">ภาพยังไม่พร้อม<br />อ่านคำสอนและเช็กตัวเองด้านล่างได้</p> : <>
      {!loaded && <span className="media-fallback" role="status">กำลังโหลดภาพสาธิต…</span>}
      <div className="photo-mirror" style={{ transform: mirrored ? 'scaleX(-1)' : undefined }}>
        <img src={imageUrl(id)} alt={alt + (left ? ' สำหรับผู้ถนัดซ้าย' : ' สำหรับผู้ถนัดขวา')} draggable={false}
          style={{ transform: `translateX(-${frame * 100 / 3}%)`, opacity: loaded ? 1 : 0 }}
          onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />
      </div>
    </>}
  </div>;
}

export default function InstructionViewer({ lesson, left, step, onStep }: { lesson: Lesson; left: boolean; step: number; onStep: (n: number) => void }) {
  const index = Math.max(0, Math.min(step, lesson.steps.length - 1));
  const current = lesson.steps[index];
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const [zoom, setZoom] = useState(1);
  const close = () => { dialog.current?.close(); opener.current?.focus(); };
  useEffect(() => { dialog.current?.close(); setZoom(1); }, [lesson.id, index]);
  const imageId = current.image ?? lesson.id;
  const direction = targetDirection(lesson, left);
  return <section className="instruction" aria-label="คู่มือทีละขั้น">
    <div className="instruction-meta"><span>ขั้น {index + 1} / {lesson.steps.length}</span><span>{left ? 'สำหรับคนถนัดซ้าย' : 'สำหรับคนถนัดขวา'}</span></div>
    <button type="button" className="photo-button" ref={opener} aria-label={`ขยายภาพ ${current.focus}`} onClick={() => { setZoom(1); dialog.current?.showModal(); }}>
      <CoachingImage id={imageId} frame={current.frame} left={left} alt={current.alt} />
      <span className="target-label">{direction && <GuideIcon kind={direction} />}{targetLabel(lesson, left)}</span>
      <span className="expand-label">ขยายดู{current.focus} <GuideIcon kind="zoom" /></span>
    </button>
    <div className="image-key"><span>{direction && <GuideIcon kind={direction} />}{targetLabel(lesson, left)}</span><span>{lesson.camera === 'detail' ? 'ลูกอยู่นอกภาพ' : 'จุดตั้งต้นลูก: ลูกสีขาวในภาพตั้งท่า'}</span></div>
    <div className="step-copy" aria-live="polite" aria-atomic="true">
      <h2><span className="step-number">{index + 1}</span>{current.action}</h2>
      <div className="self-check"><strong>เช็กตัวเอง</strong><p>{current.check}</p></div>
    </div>
    <div className="step-navigation">
      <button type="button" className="btn btn-secondary" disabled={index === 0} onClick={() => onStep(index - 1)}><GuideIcon kind="left" />ก่อนหน้า</button>
      <button type="button" className="btn btn-small" disabled={index === lesson.steps.length - 1} onClick={() => onStep(index + 1)}>ถัดไป<GuideIcon kind="right" /></button>
    </div>
    <div className="step-picker" role="group" aria-label="เลือกขั้นตอน">
      {lesson.steps.map((s, i) => <button key={i} type="button" aria-label={`ขั้น ${i + 1}: ${s.action}`} aria-pressed={i === index} onClick={() => onStep(i)}>{i + 1}</button>)}
    </div>
    <p className="hand-key">{handTerms(left)}</p>
    <p className="illustration-note">ภาพประกอบที่สร้างขึ้นด้วย AI · ผู้สาธิตสมมติ · ยังไม่ผ่านการตรวจท่าโดยโปรกอล์ฟ ภาพไม่ใช่เกณฑ์วัดมุมหรือระยะยืน</p>
    <dialog ref={dialog} className="photo-dialog" aria-label={`ภาพขยาย: ${current.focus}`} onCancel={() => opener.current?.focus()} onClick={e => { if (e.target === dialog.current) close(); }}>
      <div className="dialog-toolbar"><h2>{current.focus}</h2><button type="button" className="btn btn-secondary" onClick={close}>ปิดภาพ</button></div>
      <div className="zoom-scroll"><div style={{ width: `${zoom * 100}%` }}><CoachingImage id={imageId} frame={current.frame} left={left} alt={current.alt} /></div></div>
      <label className="zoom-control">ขยายภาพ <input type="range" min="1" max="3" step="0.25" value={zoom} onChange={e => setZoom(Number(e.target.value))} /></label>
      <p>{current.action}</p><p className="muted">{current.check}</p>
    </dialog>
  </section>;
}
