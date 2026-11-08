import InstructionViewer, { CoachingImage } from './InstructionViewer';
import { FOUNDATIONS, lessonById } from './coaching';
import GuideIcon from './GuideIcon';

export default function Learn({ id, left, progress, onStep, onOpen, onBack, returnToDrill }: {
  id: string | null; left: boolean; progress: Record<string, number>; onStep: (id: string, n: number) => void;
  onOpen: (id: string) => void; onBack: () => void; returnToDrill: boolean;
}) {
  const lesson = id ? lessonById(id) : undefined;
  if (lesson) return <>
    <button className="text-back" type="button" onClick={onBack}><GuideIcon kind="left" />{returnToDrill ? 'กลับไปซ้อมต่อ' : 'ท่าพื้นฐานทั้งหมด'}</button>
    <header className="masthead"><h1>{lesson.title}</h1><p className="lede">ดูทีละขั้น แล้วลองทำอย่างช้า ๆ ในช่วงที่ไม่เจ็บ</p></header>
    <InstructionViewer key={lesson.id} lesson={lesson} left={left} step={progress[lesson.id] ?? 0} onStep={n => onStep(lesson.id, n)} />
    {lesson.id === 'grip' && <section className="grip-options"><h2>เลือกวิธีเชื่อมมือที่สบาย</h2>
      <p>ไม่มีแบบเดียวที่เหมาะกับทุกคน ลองจับเบา ๆ แล้วเลือกแบบที่มั่นคงและไม่เจ็บ</p>
      <dl><dt>Overlap · วางซ้อน</dt><dd>นิ้วก้อยข้างตามวางบนร่องระหว่างนิ้วชี้กับนิ้วกลางข้างนำ</dd><dt>Interlock · เกี่ยวนิ้ว</dt><dd>นิ้วก้อยข้างตามเกี่ยวกับนิ้วชี้ข้างนำอย่างหลวม ๆ</dd><dt>Ten-finger · สิบนิ้ว</dt><dd>นิ้วทั้งสองมือจับด้าม โดยไม่มีนิ้วซ้อนหรือเกี่ยวกัน</dd></dl>
      <p className="muted">ไม่ต้องฝืนกดนิ้วให้เหมือนภาพ หากไม่แน่ใจให้โค้ชช่วยดูการสัมผัสกริปจริง</p>
    </section>}
    <section className="sources"><h2>อ่านจากผู้สอน</h2>{lesson.sources.map(s => <p key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.title} <GuideIcon kind="external" /></a></p>)}</section>
    <button type="button" className="btn btn-primary" onClick={onBack}>{returnToDrill ? 'กลับไปซ้อมต่อ' : 'กลับไปเลือกบทเรียน'}</button>
  </>;
  return <>
    <header className="masthead"><h1>เริ่มจากท่าที่เข้าใจ</h1><p className="lede">6 บทพื้นฐาน ดูให้เห็น แล้วค่อยหยิบไม้ทำตาม</p></header>
    <div className="lesson-list">{FOUNDATIONS.map((l, i) => <button type="button" className="lesson-row" key={l.id} onClick={() => onOpen(l.id)}>
      <CoachingImage id={l.id} frame={l.id === 'grip' ? 2 : 1} left={left} alt={l.title} />
      <span><small>บท {i + 1} · {l.steps.length} ขั้น</small><strong>{l.title}</strong><span className="muted">{progress[l.id] !== undefined ? `อ่านถึงขั้น ${progress[l.id] + 1}` : 'เริ่มดูทีละขั้น'} <GuideIcon kind="right" /></span></span>
    </button>)}</div>
    <p className="illustration-note">ภาพผู้สาธิตสมมติสร้างด้วย AI ใช้ประกอบคำสอน ยังไม่ผ่านการตรวจโดยโปรกอล์ฟ</p>
  </>;
}
