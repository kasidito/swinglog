import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BALLS_PER_TRAY, DRILLS, PREROUND, SYMPTOMS, Drill, Flight, buildSession, fullSwing,
  straightPct, suggestSymptom, symptomAvailable,
} from './engine';
import Analyze from './Analyze';
import DrillDiagram from './DrillDiagram';
import InstructionViewer, { CoachingImage } from './InstructionViewer';
import Learn from './Learn';
import { lessonById } from './coaching';
import GuideIcon from './GuideIcon';
import { AppState, Session, defaultState, isPersistent, load, requestPersist, save, uid } from './store';

type Screen = 'home' | 'session' | 'drill' | 'summary' | 'history' | 'settings' | 'video' | 'learn';
const drillById = (id: string) => DRILLS.find((d) => d.id === id);
const EQUIP: Record<string, string> = { driver: 'ไดรเวอร์', iron: 'เหล็ก', wedge: 'เวดจ์', putter: 'พัตเตอร์', alignment_stick: 'ไม้ชี้แนว', tee: 'ที', towel: 'ผ้า' };
const FLIGHTS: { id: Flight; label: string; path: string }[] = [
  { id: 'hook', label: 'ฮุก', path: 'M8 26C8 16 6 8 2 2' },
  { id: 'draw', label: 'draw', path: 'M14 26C14 14 12 6 9 2' },
  { id: 'straight', label: 'ตรง', path: 'M14 26V2' },
  { id: 'fade', label: 'fade', path: 'M14 26C14 14 16 6 19 2' },
  { id: 'slice', label: 'สไลซ์', path: 'M20 26C20 16 22 8 26 2' },
];
const VERSION = '2.1.1';

function symptomText(id: string | null, left: boolean) {
  if (id === null) return { name: 'ให้แอปเลือก', desc: 'ไม่แน่ใจ ผสมหลายแบบ' };
  if (id === PREROUND) return { name: 'ก่อนออกรอบ', desc: 'อุ่นเครื่องและสร้างความมั่นใจ ไม่แก้สวิง' };
  const s = SYMPTOMS.find((x) => x.id === id);
  if (!s) return { name: id, desc: '' };
  const [name, rest] = s.label.split(' (');
  let desc = rest ? rest.replace(')', '') : '';
  if (left && (id === 'slice' || id === 'hook')) desc = desc.replace('ขวา', '#').replace('ซ้าย', 'ขวา').replace('#', 'ซ้าย');
  return { name, desc };
}

const SYM_ICON: Record<string, string> = {
  auto: 'M4 12h4M16 12h4M12 4v4M12 16v4M7 7l2 2M15 15l2 2M17 7l-2 2M9 15l-2 2',
  preround: 'M6 21V4M6 4l11 4-11 5M3 21h9',
  slice: 'M8 21C8 12 10 6 18 3', hook: 'M16 21C16 12 14 6 6 3',
  contact: 'M3 18h18M7 18c1-4 3-7 5-7s3 2 3 4M12 11a2 2 0 1 0 0-4a2 2 0 0 0 0 4',
  short_putt: 'M4 17h16M12 17a3 3 0 0 0 0-6M5 12h4', lag_putt: 'M3 17h18M6 13h3M11 13h3M16 13h3',
  chip: 'M3 18c4-9 10-11 18-6M3 18h18', bunker: 'M3 16c3-3 6 3 9 0s6 3 9 0M12 12a2 2 0 1 0 0-4a2 2 0 0 0 0 4',
};
const FLAG_COLORS = ['red', 'white', 'yellow', 'blue'] as const;
const Wordmark = () => (
  <span className="wordmark" aria-label="SwingLog">
    <svg width="18" height="22" viewBox="0 0 18 22" aria-hidden="true"><path d="M3 21V2" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /><path d="M3 2h12l-3.5 4.5L15 11H3z" fill="var(--flag-yellow)" /></svg>
    <span>Swing<b>Log</b></span>
  </span>
);
const Icon = ({ d, size = 22 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const I = {
  flag: 'M5 21V4M5 4l12 4-12 5', check: 'M5 12l5 5 9-10', clock: 'M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18M12 7v5l3 2',
  gear: 'M9 2h6v3l2 1 2-2 3 5-2 2v2l2 2-3 5-2-2-2 1v3H9v-3l-2-1-2 2-3-5 2-2v-2L2 9l3-5 2 2 2-1zM12 8a4 4 0 1 0 0 8a4 4 0 0 0 0-8',
  back: 'M15 18l-6-6 6-6',
  ball: 'M12 4a8 8 0 1 0 0 16a8 8 0 0 0 0-16M9.5 9.5h.01M13 8.5h.01M14.5 11.5h.01M11 12.5h.01',
  tool: 'M5 19L19 5M15 5h4v4',
  cal: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  cam: 'M3 7h4l2-3h6l2 3h4v13H3zM12 10a3.5 3.5 0 1 0 0 7a3.5 3.5 0 0 0 0-7',
};

export default function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [screen, setScreen] = useState<Screen>('home');
  const [drillId, setDrillId] = useState<string | null>(null);
  const [summaryId, setSummaryId] = useState<string | null>(null);
  const [notices, setNotices] = useState<string[]>([]);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [lessonReturn, setLessonReturn] = useState<'learn' | 'drill'>('learn');

  useEffect(() => { load().then(setState); requestPersist(); }, []);
  useEffect(() => { if (state) save(state); }, [state]);

  const settings = state?.settings ?? defaultState().settings;
  useEffect(() => {
    const root = document.documentElement;
    const dark = settings.theme === 'dark' || (settings.theme === 'auto' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
    root.dataset.theme = dark ? 'dark' : 'light';
    root.dataset.large = String(settings.largeText);
  }, [settings.theme, settings.largeText]);

  if (!state) return <div className="app"><div className="screen"><p className="muted">กำลังโหลด…</p></div></div>;

  const update = (fn: (s: AppState) => AppState) => setState((s) => (s ? fn(s) : s));
  const active = state.sessions.find((s) => s.status === 'active') ?? null;
  const go = (s: Screen) => { setScreen(s); window.scrollTo(0, 0); };
  const progress = state.coachingProgress ?? {};
  const setStep = (id: string, n: number) => update(s => ({ ...s, coachingProgress: { ...s.coachingProgress, [id]: n } }));
  const openLesson = (id: string, fromDrill = false) => { setLessonId(id); setLessonReturn(fromDrill ? 'drill' : 'learn'); go('learn'); };

  const startSession = (unit: 'min' | 'ball', amount: number, symptomId: string | null) => {
    const recent = state.sessions.filter((s) => s.status === 'completed').slice(-3).flatMap((s) => s.doneDrillIds);
    const plan = buildSession({ unit, amount, symptomId, facility: { green: settings.hasGreen, bunker: settings.hasBunker }, recentDrillIds: recent });
    const session: Session = {
      id: uid(), startedAt: new Date().toISOString(), endedAt: null, unit, amount,
      mode: symptomId === PREROUND ? 'preround' : 'normal', symptomId: symptomId === PREROUND ? null : symptomId,
      drillIds: plan.drillIds, doneDrillIds: [], freeHit: plan.freeHit, status: 'active',
    };
    update((s) => ({
      ...s,
      settings: { ...s.settings, lastUnit: unit, lastAmount: amount },
      sessions: [...s.sessions.map((x) => (x.status === 'active' ? { ...x, status: 'abandoned' as const, endedAt: new Date().toISOString() } : x)), session],
    }));
    setNotices(plan.notices);
    go('session');
  };

  const markDone = (id: string) => update((s) => ({
    ...s, sessions: s.sessions.map((x) => (x.status === 'active' && !x.doneDrillIds.includes(id) ? { ...x, doneDrillIds: [...x.doneDrillIds, id] } : x)),
  }));
  const finish = () => {
    if (!active) return;
    update((s) => ({ ...s, sessions: s.sessions.map((x) => (x.id === active.id ? { ...x, status: 'completed', endedAt: new Date().toISOString() } : x)) }));
    setSummaryId(active.id); go('summary');
  };
  const abandon = () => {
    update((s) => ({ ...s, sessions: s.sessions.map((x) => (x.status === 'active' ? { ...x, status: 'abandoned', endedAt: new Date().toISOString() } : x)) }));
    go('home');
  };
  const logShot = (drill: string, flight: Flight) => {
    if (!active) return;
    update((s) => ({ ...s, shots: [...s.shots, { id: uid(), sessionId: active.id, drillId: drill, flight, createdAt: new Date().toISOString() }] }));
  };

  let body: JSX.Element;
  if (screen === 'session' && active) body = <SessionScreen session={active} notices={notices} onOpen={(id) => { setDrillId(id); go('drill'); }} onDone={markDone} onFinish={finish} onAbandon={abandon} state={state} />;
  else if (screen === 'drill' && active && drillId && drillById(drillId)) body = <DrillScreen drill={drillById(drillId)!} session={active} state={state} step={progress[drillId] ?? 0} onStep={n => setStep(drillId, n)} onLesson={id => openLesson(id, true)} onBack={() => go('session')} onDone={() => { markDone(drillId); go('session'); }} onShot={(f) => logShot(drillId, f)} />;
  else if (screen === 'learn') body = <Learn id={lessonId} left={settings.handedness === 'left'} progress={progress} onStep={setStep} onOpen={id => openLesson(id)} returnToDrill={lessonReturn === 'drill' && !!active} onBack={() => { if (lessonReturn === 'drill' && active) go('drill'); else { setLessonId(null); go('learn'); } }} />;
  else if (screen === 'summary' && summaryId) body = <SummaryScreen state={state} sessionId={summaryId} onHome={() => go('home')} />;
  else if (screen === 'history') body = <HistoryScreen state={state} onDelete={(id) => update((s) => ({ ...s, sessions: s.sessions.filter((x) => x.id !== id), shots: s.shots.filter((x) => x.sessionId !== id) }))} />;
  else if (screen === 'video') body = <Analyze left={settings.handedness === 'left'} canLog={!!active} onLog={(f) => logShot('video', f)} />;
  else if (screen === 'settings') body = <SettingsScreen state={state} onChange={(patch) => update((s) => ({ ...s, settings: { ...s.settings, ...patch } }))} onReset={() => setState(defaultState())} onImport={(n) => setState(n)} />;
  else body = <HomeScreen state={state} active={active} onStart={startSession} onResume={() => go('session')} onAbandon={abandon} onLearn={() => openLesson('alignment')} />;

  const tab = screen === 'history' ? 'history' : screen === 'learn' ? 'learn' : screen === 'video' ? 'video' : 'home';
  return (
    <div className="app">
      <header className="app-header"><Wordmark /><button type="button" className="header-settings" aria-label="ตั้งค่า" onClick={() => go('settings')}><Icon d={I.gear} /></button></header>
      <main className="screen">{body}</main>
      {screen !== 'drill' && (
        <nav className="tabs" aria-label="เมนูหลัก">
          <button type="button" aria-current={tab === 'home' ? 'page' : undefined} onClick={() => go(active && screen !== 'home' ? 'session' : 'home')}><Icon d={I.flag} />ฝึก</button>
          <button type="button" aria-current={tab === 'learn' ? 'page' : undefined} onClick={() => { setLessonId(null); setLessonReturn('learn'); go('learn'); }}><Icon d="M4 4h6l2 2 2-2h6v16h-6l-2 2-2-2H4zM12 6v16" />ท่าพื้นฐาน</button>
          <button type="button" aria-current={tab === 'video' ? 'page' : undefined} onClick={() => go('video')}><Icon d={I.cam} />วิดีโอ</button>
          <button type="button" aria-current={tab === 'history' ? 'page' : undefined} onClick={() => go('history')}><Icon d={I.clock} />ประวัติ</button>
        </nav>
      )}
    </div>
  );
}

function HomeScreen({ state, active, onStart, onResume, onAbandon, onLearn }: {
  state: AppState; active: Session | null; onStart: (u: 'min' | 'ball', a: number, s: string | null) => void; onResume: () => void; onAbandon: () => void; onLearn: () => void;
}) {
  const st = state.settings;
  const [unit, setUnit] = useState<'min' | 'ball'>(st.lastUnit);
  const [amount, setAmount] = useState<number>(st.lastAmount);
  const amounts = unit === 'min' ? [10, 15, 30] : [BALLS_PER_TRAY, BALLS_PER_TRAY * 2];
  const amt = amounts.includes(amount) ? amount : amounts[unit === 'min' ? 1 : 0];
  const facility = { green: st.hasGreen, bunker: st.hasBunker };
  const left = st.handedness === 'left';
  const flights = state.shots.map((s) => s.flight);
  const suggestion = suggestSymptom(flights);
  const [symptom, setSymptom] = useState<string | null>(suggestion);
  const options: (string | null)[] = [null, ...(unit === 'min' ? [PREROUND] : []), ...SYMPTOMS.filter((s) => symptomAvailable(s, facility, unit)).map((s) => s.id)];
  const chosen = options.includes(symptom) ? symptom : null;

  return (
    <>
      <header className="masthead">
        <h1>ซ้อมวันนี้<br /><span className="heading-soft">ให้เข้าใจมากขึ้น</span></h1>
        <p className="lede">เลือกเวลาที่มี แล้วฝึกทีละเรื่อง</p>
        {suggestion && <p className="lede">ลูกที่บันทึกไว้ส่วนใหญ่ออกเป็น<strong>{symptomText(suggestion, left).name}</strong> แอปเลือกให้แล้ว เปลี่ยนได้</p>}
      </header>
      {active && (
        <div className="notice row">
          <span>มีเซสชันค้าง ทำไป {active.doneDrillIds.length} จาก {active.drillIds.length} ดริล</span>
          <span className="spacer" />
          <button type="button" className="btn btn-small" onClick={onResume}>ทำต่อ</button>
          <button type="button" className="btn btn-ghost" onClick={onAbandon}>ทิ้ง</button>
        </div>
      )}
      <button type="button" className="coaching-entry" onClick={onLearn}>
        <CoachingImage id="alignment" frame={1} left={left} alt="ผู้สาธิตตั้งแนวเท้าขนานไม้ชี้แนว โดยมีลูกอยู่หน้าหัวไม้" />
        <span><strong>ตั้งท่าให้พร้อม<br />ก่อนลูกแรก</strong><span>ดูแนวยืนทีละขั้น <GuideIcon kind="right" /></span><small>ภาพประกอบ AI · รอโปรตรวจ</small></span>
      </button>
      <section className="board" aria-labelledby="amt-q">
        <div className="board-head">
          <h2 id="amt-q">{unit === 'min' ? 'มีเวลาเท่าไหร่' : 'ซื้อลูกกี่ถาด'}</h2>
          <div className="unit-switch" role="group" aria-label="นับเป็น">
            <button type="button" aria-pressed={unit === 'min'} onClick={() => { setUnit('min'); setAmount(15); }}>นาที</button>
            <button type="button" aria-pressed={unit === 'ball'} onClick={() => { setUnit('ball'); setAmount(BALLS_PER_TRAY); }}>ถาด</button>
          </div>
        </div>
        <div className="amounts" role="group" aria-labelledby="amt-q">
          {amounts.map((a) => (
            <button key={a} type="button" className="amount" aria-pressed={amt === a} onClick={() => setAmount(a)}>
              <span className="num">{unit === 'min' ? a : a / BALLS_PER_TRAY}</span>
              <span className="unit">{unit === 'min' ? 'นาที' : `ถาด, ${a} ลูก`}</span>
            </button>
          ))}
        </div>
      </section>
      <section aria-labelledby="sym-q">
        <h2 id="sym-q" className="section-title">วันนี้อยากฝึกเรื่องไหน</h2>
        <div className="symlist" role="group" aria-labelledby="sym-q">
          {options.map((id) => {
            const t = symptomText(id, left);
            const icon = SYM_ICON[id ?? 'auto'] ?? SYM_ICON.auto;
            return (
              <button key={id ?? 'auto'} type="button" className="sym" aria-pressed={chosen === id} onClick={() => setSymptom(id)}>
                <span className="sym-icon" style={left && (id === 'slice' || id === 'hook') ? { transform: 'scaleX(-1)' } : undefined}><Icon d={icon} size={22} /></span>
                <span className="sym-text"><span className="sym-name">{t.name}{suggestion && id === suggestion && <span className="tag">แนะนำ</span>}</span><small>{t.desc}</small></span>
              </button>
            );
          })}
        </div>
        {unit === 'ball' && <p className="muted">โหมดถาดใช้เฉพาะดริลสวิงเต็มในช่องตี ลูกที่เหลือเป็นตีอิสระ</p>}
        {unit === 'min' && !st.hasGreen && <p className="muted">ซ่อนพัตต์และชิปไว้ เพราะตั้งค่าว่าไม่มีกรีนซ้อม</p>}
      </section>
      <div className="practice-recap"><strong>แผนที่เลือก</strong><span>{unit === 'min' ? `${amt} นาที` : `${amt / BALLS_PER_TRAY} ถาด · ${amt} ลูก`} · {symptomText(chosen, left).name}</span><small>ดูรายการดริลและภาพสอนก่อนลงมือได้ในขั้นถัดไป</small></div>
      <button type="button" className="btn btn-primary dock" onClick={() => onStart(unit, amt, chosen)}>เริ่มเซสชัน</button>
    </>
  );
}

function SessionScreen({ session, notices, state, onOpen, onDone, onFinish, onAbandon }: {
  session: Session; notices: string[]; state: AppState; onOpen: (id: string) => void; onDone: (id: string) => void; onFinish: () => void; onAbandon: () => void;
}) {
  const done = session.doneDrillIds.length, total = session.drillIds.length;
  const allDone = done === total;
  const shots = state.shots.filter((s) => s.sessionId === session.id).length;
  const title = session.mode === 'preround' ? 'ก่อนออกรอบ' : symptomText(session.symptomId, state.settings.handedness === 'left').name;
  return (
    <>
      <header className="masthead">
        <h1>{title}</h1>
        <p className="lede">{session.unit === 'min' ? `${session.amount} นาที` : `${session.amount / BALLS_PER_TRAY} ถาด, ${session.amount} ลูก`}, ทำแล้ว {done} จาก {total} ดริล{shots ? `, บันทึกวิถีลูก ${shots} ลูก` : ''}</p>
      </header>
      {notices.map((n) => <div key={n} className="notice">{n}</div>)}
      <ol className="lane" aria-label="ดริลในเซสชัน เรียงจากใกล้ไปไกล">
        {session.drillIds.map((id, i) => {
          const d = drillById(id);
          const isDone = session.doneDrillIds.includes(id);
          const isNext = !isDone && session.drillIds.findIndex((x) => !session.doneDrillIds.includes(x)) === i;
          const dist = String(i + 1).padStart(2, '0');
          const flag = FLAG_COLORS[i % FLAG_COLORS.length];
          if (!d) return <li key={id} className="lane-row"><span className="muted">ดริลนี้ถูกเลิกใช้แล้ว</span></li>;
          return (
            <li key={id} className={`lane-row${isDone ? ' done' : ''}${isNext ? ' next' : ''}`}>
              <span className="marker" aria-hidden="true">
                <svg width="28" height="34" viewBox="0 0 28 34"><path d="M6 32V3" className="pole" /><path d="M6 3h17l-5 6 5 6H6z" className={isDone ? 'flag lit' : 'flag'} style={isDone ? undefined : { fill: `var(--flag-${flag})` }} /></svg>
                <span className="dist">{dist}</span>
              </span>
              <button type="button" className="open" onClick={() => onOpen(id)}>
                <span className="name">{d.name}</span>
                <span className="meta">{d.isWarmup ? 'อุ่นเครื่อง, ' : ''}{d.minutes} นาที{d.balls ? `, ${d.balls} ลูก` : ''}</span>
              </button>
              <button type="button" className="check" aria-pressed={isDone} disabled={isDone} onClick={() => onDone(id)} aria-label={isDone ? `${d.name} เสร็จแล้ว` : `ทำ ${d.name} เสร็จแล้ว`}>
                {isDone ? <Icon d={I.check} size={20} /> : 'เสร็จ'}
              </button>
            </li>
          );
        })}
        {session.freeHit > 0 && (
          <li className="lane-row free">
            <span className="marker" aria-hidden="true"><span className="dist">ตี</span></span>
            <span className="open"><span className="name">ตีอิสระ {session.freeHit} ลูก</span><span className="meta">ลูกที่เหลือจากถาด ตีตามสบาย</span></span>
          </li>
        )}
      </ol>
      <div className="totals" aria-label="รวมทั้งเซสชัน">
        <span><Icon d={I.clock} size={18} /><b>{session.drillIds.reduce((a, id) => a + (drillById(id)?.minutes ?? 0), 0)}</b> นาที</span>
        <span><Icon d={I.ball} size={18} /><b>{session.drillIds.reduce((a, id) => a + (drillById(id)?.balls ?? 0), 0) + session.freeHit}</b> ลูก</span>
        <span><Icon d={I.check} size={18} /><b>{done}/{total}</b> ดริล</span>
      </div>
      <p className="muted" style={{ margin: 0 }}>แตะชื่อดริลเพื่อดูขั้นตอน ภาพประกอบ และบันทึกวิถีลูก</p>
      <div className="spacer" />
      {allDone
        ? <button type="button" className="btn btn-primary" onClick={onFinish}>จบเซสชัน</button>
        : <button type="button" className="btn btn-secondary" onClick={onFinish}>จบก่อน ({done}/{total})</button>}
      <button type="button" className="btn btn-ghost" onClick={onAbandon}>ยกเลิกเซสชันนี้</button>
    </>
  );
}

function FlightIcon({ path, mirror }: { path: string; mirror: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <g transform={mirror ? 'translate(28,0) scale(-1,1)' : undefined}><path d={path} /></g>
    </svg>
  );
}

function DrillScreen({ drill, session, state, step, onStep, onLesson, onBack, onDone, onShot }: {
  drill: Drill; session: Session; state: AppState; step: number; onStep: (n: number) => void; onLesson: (id: string) => void; onBack: () => void; onDone: () => void; onShot: (f: Flight) => void;
}) {
  const left = state.settings.handedness === 'left';
  const shots = state.shots.filter((s) => s.sessionId === session.id && s.drillId === drill.id);
  const [flash, setFlash] = useState<Flight | null>(null);
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const tap = (f: Flight) => { onShot(f); setFlash(f); window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setFlash(null), 350); };
  const isDone = session.doneDrillIds.includes(drill.id);
  const lesson = lessonById(drill.id);
  return (
    <>
      <div className="topbar">
        <button type="button" className="back" onClick={onBack} aria-label="กลับไปรายการดริล"><Icon d={I.back} size={22} /></button>
        <span className="muted">ดริล {session.drillIds.indexOf(drill.id) + 1} จาก {session.drillIds.length}</span>
      </div>
      <header className="masthead">
        <h1>{drill.name}</h1>
        <p className="lede">{drill.goal}</p>
        <div className="facts">
          <span><Icon d={I.clock} size={16} />{drill.minutes} นาที</span>
          {drill.balls ? <span><Icon d={I.ball} size={16} />{drill.balls} ลูก</span> : null}
          {drill.equipment.map((e) => <span key={e}><Icon d={I.tool} size={16} />{EQUIP[e] ?? e}</span>)}
          {drill.isWarmup && <span className="hot">อุ่นเครื่อง</span>}
          {drill.sources.length < 2 && <span>รอตรวจสอบเนื้อหา</span>}
        </div>
      </header>
      {lesson ? <InstructionViewer lesson={lesson} left={left} step={step} onStep={onStep} /> : <ol className="steps">{drill.steps.map(s => <li key={s}>{s}</li>)}</ol>}
      {lesson && <section className="related-lesson"><h2>ทบทวนก่อนลอง</h2>{lesson.related.map(id => <button type="button" key={id} onClick={() => onLesson(id)}>{lessonById(id)?.title} <span>เปิดบทเรียน <GuideIcon kind="right" /></span></button>)}<p className="muted">กลับมาดริลนี้ได้ ขั้นตอนและลูกที่บันทึกไว้ยังอยู่</p></section>}
      <details className="diagram-details"><summary>ดูผังอุปกรณ์และแนวตีเพิ่มเติม</summary><DrillDiagram id={drill.id} left={left} /></details>
      {fullSwing(drill) && (
        <section className="stack">
          <div className="row"><h2>ลูกนี้ไปทางไหน</h2><span className="spacer" /><span className="muted">บันทึกแล้ว {shots.length}{drill.balls ? ` จาก ${drill.balls}` : ''} ลูก</span></div>
          <div className="flights" role="group" aria-label="บันทึกวิถีลูก">
            {(left ? [...FLIGHTS].reverse() : FLIGHTS).map((f) => (
              <button key={f.id} type="button" className={`flight${flash === f.id ? ' flash' : ''}`} onClick={() => tap(f.id)}>
                <FlightIcon path={f.path} mirror={left} />{f.label}
              </button>
            ))}
          </div>
          {shots.length > 0 && (() => {
            const st = shots.filter((x) => x.flight === 'straight').length;
            const p = Math.round((st / shots.length) * 100);
            return (
              <div className="straight">
                <span><b>{p}%</b> ตรง <span className="muted">({st}/{shots.length} ลูก)</span></span>
                <div className="progress"><span style={{ width: `${p}%` }} /></div>
              </div>
            );
          })()}
          <span className="muted" aria-live="polite">{flash ? `บันทึก ${FLIGHTS.find((f) => f.id === flash)!.label} แล้ว` : 'แตะหลังตีแต่ละลูก ไม่บันทึกก็ได้'}</span>
        </section>
      )}
      {drill.sources.length > 0 && (
        <section className="sources">
          <p className="q">แหล่งอ้างอิง</p>
          <ul className="muted" style={{ margin: 0, paddingLeft: '1.2em' }}>
            {drill.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a></li>)}
          </ul>
        </section>
      )}
      <div className="spacer" />
      {isDone ? <button type="button" className="btn btn-secondary" onClick={onBack}>ทำแล้ว กลับ</button>
        : <button type="button" className="btn btn-primary" onClick={onDone}>เสร็จ</button>}
    </>
  );
}

function Distribution({ flights }: { flights: Flight[] }) {
  if (!flights.length) return <p className="muted">ไม่ได้บันทึกวิถีลูกในเซสชันนี้</p>;
  const counts = FLIGHTS.map((f) => flights.filter((x) => x === f.id).length);
  const max = Math.max(...counts, 1);
  // Top-down view of the bay: tee at bottom, five landing lanes fan out; lane length = share of shots.
  const angles = [-34, -16, 0, 16, 34];
  return (
    <figure className="fan">
      <svg viewBox="0 0 300 170" role="img" aria-label={FLIGHTS.map((f, i) => `${f.label} ${counts[i]} ลูก`).join(', ')}>
        {[60, 100, 140].map((r) => <path key={r} d={`M ${150 - r * Math.sin(0.7)} ${160 - r * Math.cos(0.7)} A ${r} ${r} 0 0 1 ${150 + r * Math.sin(0.7)} ${160 - r * Math.cos(0.7)}`} className="fan-arc" />)}
        {FLIGHTS.map((f, i) => {
          const len = 24 + (counts[i] / max) * 120;
          const rad = (angles[i] * Math.PI) / 180;
          const x = 150 + len * Math.sin(rad), y = 160 - len * Math.cos(rad);
          return (
            <g key={f.id} className={f.id === 'straight' ? 'fan-lane on' : 'fan-lane'} opacity={counts[i] ? 1 : 0.35}>
              <line x1="150" y1="160" x2={x} y2={y} />
              <circle cx={x} cy={y} r={counts[i] ? 5 + (counts[i] / max) * 5 : 3} />
            </g>
          );
        })}
        <circle cx="150" cy="160" r="4" className="fan-tee" />
      </svg>
      <figcaption className="fan-key">
        {FLIGHTS.map((f, i) => (
          <span key={f.id} className={f.id === 'straight' ? 'on' : undefined}><b>{counts[i]}</b>{f.label}</span>
        ))}
      </figcaption>
    </figure>
  );
}

function SummaryScreen({ state, sessionId, onHome }: { state: AppState; sessionId: string; onHome: () => void }) {
  const s = state.sessions.find((x) => x.id === sessionId);
  const flights = state.shots.filter((x) => x.sessionId === sessionId).map((x) => x.flight);
  const pct = straightPct(flights);
  if (!s) return <p>ไม่พบเซสชัน</p>;
  return (
    <>
      <header className="masthead">
        <h1>ฝึกเสร็จแล้ว</h1>
        <p className="lede">ทำ {s.doneDrillIds.length} จาก {s.drillIds.length} ดริล{flights.length ? <>, ลูกตรงราว <strong>{pct}%</strong> จาก {flights.length} ลูกที่บันทึก</> : ''}</p>
      </header>
      <section><h2 className="section-title">ลูกไปทางไหน</h2><div className="card"><Distribution flights={flights} /></div></section>
      {suggestSymptom(state.shots.map((x) => x.flight)) && <div className="notice">ครั้งหน้าแอปจะแนะนำอาการจากลูกที่บันทึกไว้</div>}
      <div className="spacer" />
      <button type="button" className="btn btn-primary" onClick={onHome}>กลับหน้าแรก</button>
    </>
  );
}

function ConfirmButton({ label, confirmLabel, onConfirm }: { label: string; confirmLabel: string; onConfirm: () => void }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => { if (!armed) return; const t = setTimeout(() => setArmed(false), 4000); return () => clearTimeout(t); }, [armed]);
  return <button type="button" className="btn btn-ghost" style={{ alignSelf: 'flex-start' }} onClick={() => (armed ? (setArmed(false), onConfirm()) : setArmed(true))}>{armed ? confirmLabel : label}</button>;
}

function HistoryScreen({ state, onDelete }: { state: AppState; onDelete: (id: string) => void }) {
  const [range, setRange] = useState<0 | 7 | 30>(0);
  const all = useMemo(() => state.sessions.filter((s) => s.status === 'completed').slice().reverse(), [state.sessions]);
  const since = range ? Date.now() - range * 86400000 : 0;
  const done = all.filter((s) => new Date(s.startedAt).getTime() >= since);
  const fmtDay = new Intl.DateTimeFormat('th-TH', { day: 'numeric' });
  const fmtMon = new Intl.DateTimeFormat('th-TH', { month: 'short' });
  const fmtTime = new Intl.DateTimeFormat('th-TH', { timeStyle: 'short' });
  const ids = done.map((s) => s.id);
  const fl = state.shots.filter((x) => ids.includes(x.sessionId)).map((x) => x.flight);
  const pct = straightPct(fl);
  return (
    <>
      <header className="masthead">
        <h1>ประวัติ</h1>
        <div className="unit-switch" role="group" aria-label="ช่วงเวลา" style={{ alignSelf: 'flex-start' }}>
          {([[0, 'ทั้งหมด'], [7, '7 วัน'], [30, '30 วัน']] as const).map(([v, l]) => (
            <button key={v} type="button" aria-pressed={range === v} onClick={() => setRange(v)}>{l}</button>
          ))}
        </div>
      </header>
      {all.length === 0 ? <p className="muted">ยังไม่มีเซสชันที่จบ เริ่มเซสชันแรกได้จากแท็บ ฝึก</p> : (
        <>
          <section className="board">
            <p className="lede" style={{ maxWidth: 'none' }}>ฝึก <strong>{done.length}</strong> ครั้ง{pct !== null ? <>, ลูกตรงราว <strong>{pct}%</strong> จาก {fl.length} ลูกที่บันทึก</> : ', ยังไม่ได้บันทึกวิถีลูก'}</p>
            {pct !== null && <div className="progress"><span style={{ width: `${pct}%` }} /></div>}
          </section>
          {done.length === 0 ? <p className="muted">ไม่มีเซสชันในช่วงนี้</p> : (
            <ul className="hist">
              {done.map((s) => {
                const f = state.shots.filter((x) => x.sessionId === s.id).map((x) => x.flight);
                const p = straightPct(f);
                const d = new Date(s.startedAt);
                return (
                  <li key={s.id}>
                    <span className="date"><b>{fmtDay.format(d)}</b>{fmtMon.format(d)}</span>
                    <span className="info">
                      <strong>{s.mode === 'preround' ? 'ก่อนออกรอบ' : symptomText(s.symptomId, state.settings.handedness === 'left').name}</strong>
                      <span className="muted">{fmtTime.format(d)}, {s.unit === 'min' ? `${s.amount} นาที` : `${s.amount} ลูก`}, ดริล {s.doneDrillIds.length}/{s.drillIds.length}{p !== null ? `, ตรง ${p}%` : ''}</span>
                    </span>
                    <ConfirmButton label="ลบ" confirmLabel="ยืนยันลบ" onConfirm={() => onDelete(s.id)} />
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </>
  );
}

export function parseBackup(text: string): AppState | null {
  try {
    const d = JSON.parse(text);
    if (d && d.schemaVersion === 1 && Array.isArray(d.sessions) && Array.isArray(d.shots) && d.settings) {
      const coachingProgress = Object.fromEntries(Object.entries(d.coachingProgress ?? {}).filter(([id, n]) => lessonById(id) && Number.isInteger(n) && Number(n) >= 0 && Number(n) < lessonById(id)!.steps.length));
      return { schemaVersion: 1, settings: { ...defaultState().settings, ...d.settings }, sessions: d.sessions, shots: d.shots, coachingProgress: coachingProgress as Record<string, number> };
    }
  } catch { /* invalid JSON */ }
  return null;
}

function SettingsScreen({ state, onChange, onReset, onImport }: { state: AppState; onChange: (p: Partial<AppState['settings']>) => void; onReset: () => void; onImport: (s: AppState) => void }) {
  const s = state.settings;
  const importInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<AppState | null>(null);
  const [importMsg, setImportMsg] = useState('');
  const readFile = async (f: File | undefined) => {
    if (!f) return;
    const parsed = parseBackup(await f.text());
    if (!parsed) { setPending(null); setImportMsg('ไฟล์นี้ไม่ใช่ข้อมูลสำรองของ SwingLog'); return; }
    setPending(parsed); setImportMsg(`พบ ${parsed.sessions.length} เซสชัน ${parsed.shots.length} ลูก ข้อมูลในเครื่องนี้จะถูกแทนที่`);
  };
  const [copied, setCopied] = useState('');
  const copyData = async () => {
    try { await navigator.clipboard.writeText(JSON.stringify(state)); setCopied('คัดลอกข้อมูลแล้ว วางเก็บไว้ในโน้ตได้'); }
    catch { setCopied('คัดลอกไม่ได้ในเบราว์เซอร์นี้'); }
  };
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `swinglog-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const Toggle = ({ label, checked, onToggle, hint }: { label: string; checked: boolean; onToggle: (v: boolean) => void; hint?: string }) => (
    <label className="switch card"><span>{label}{hint && <span className="muted" style={{ display: 'block' }}>{hint}</span>}</span><input type="checkbox" checked={checked} onChange={(e) => onToggle(e.target.checked)} /></label>
  );
  return (
    <>
      <h1>ตั้งค่า</h1>
      <section>
        <p className="q" id="hand-q">ถนัดมือ</p>
        <div className="seg seg-pill" role="group" aria-labelledby="hand-q">
          <button type="button" className="chip" aria-pressed={s.handedness === 'right'} onClick={() => onChange({ handedness: 'right' })}>ถนัดขวา</button>
          <button type="button" className="chip" aria-pressed={s.handedness === 'left'} onClick={() => onChange({ handedness: 'left' })}>ถนัดซ้าย</button>
        </div>
      </section>
      <section className="stack">
        <p className="q" style={{ margin: 0 }}>สถานที่ฝึกประจำ</p>
        <Toggle label="มีกรีนซ้อมพัตต์และชิป" checked={s.hasGreen} onToggle={(v) => onChange({ hasGreen: v })} />
        <Toggle label="มีบังเกอร์ซ้อม" checked={s.hasBunker} onToggle={(v) => onChange({ hasBunker: v })} />
      </section>
      <section className="stack">
        <p className="q" style={{ margin: 0 }} id="theme-q">การแสดงผล</p>
        <div className="row" role="group" aria-labelledby="theme-q">
          {([['auto', 'ตามเครื่อง'], ['light', 'สว่าง'], ['dark', 'มืด (กลางคืน)']] as const).map(([v, l]) => (
            <button key={v} type="button" className="chip" aria-pressed={s.theme === v} onClick={() => onChange({ theme: v })}>{l}</button>
          ))}
        </div>
        <Toggle label="ตัวอักษรใหญ่" checked={s.largeText} onToggle={(v) => onChange({ largeText: v })} />
      </section>
      <section className="stack">
        <p className="q" style={{ margin: 0 }}>ข้อมูล</p>
        {!isPersistent() && <div className="notice">เบราว์เซอร์นี้ไม่ให้เก็บข้อมูล ข้อมูลจะหายเมื่อปิดหน้า</div>}
        <p className="muted" style={{ margin: 0 }}>ข้อมูลเก็บในเครื่องนี้เท่านั้น ไม่ส่งขึ้นเซิร์ฟเวอร์ ควรส่งออกเก็บไว้เป็นระยะ</p>
        <div className="row">
          {window.self === window.top && <button type="button" className="btn btn-secondary" onClick={exportData}>ดาวน์โหลดไฟล์ JSON</button>}
          <button type="button" className="btn btn-secondary" onClick={copyData}>คัดลอกข้อมูล</button>
        </div>
        {copied && <span className="muted" aria-live="polite">{copied}</span>}
        <button type="button" className="btn btn-secondary" onClick={() => importInput.current?.click()}>นำเข้าข้อมูลสำรอง (JSON)</button>
        <input ref={importInput} type="file" accept="application/json,.json" hidden onChange={(e) => readFile(e.target.files?.[0])} />
        {importMsg && <span className="muted" aria-live="polite">{importMsg}</span>}
        {pending && <button type="button" className="btn btn-small" onClick={() => { onImport(pending); setPending(null); setImportMsg('นำเข้าข้อมูลแล้ว'); }}>ยืนยันการนำเข้า</button>}
        <ConfirmButton label="ลบข้อมูลทั้งหมด" confirmLabel="แตะอีกครั้งเพื่อลบทั้งหมด" onConfirm={onReset} />
      </section>
      <p className="muted">SwingLog v{VERSION}. ฟรี ไม่มีโฆษณา ดริลเขียนใหม่จากแหล่งที่อ้างอิง ไม่ใช่คำแนะนำจากโค้ช</p>
    </>
  );
}
