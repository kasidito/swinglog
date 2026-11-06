import drillsData from './content/drills.json';
import symptomsData from './content/symptoms.json';

export type Area = 'driver' | 'iron' | 'chip' | 'putt' | 'bunker';
export type Flight = 'hook' | 'draw' | 'straight' | 'fade' | 'slice';

export interface Source { title: string; url: string }
export interface Drill {
  id: string; name: string; goal: string; area: Area; symptoms: string[];
  minutes: number; balls: number | null; equipment: string[]; steps: string[];
  isWarmup: boolean; sources: Source[]; version: number;
}
export interface Symptom { id: string; label: string; area: Area }

export const DRILLS = drillsData as Drill[];
export const SYMPTOMS = symptomsData as Symptom[];

export const BALLS_PER_TRAY = 40;
export const PREROUND = 'preround';

export interface Facility { green: boolean; bunker: boolean }
export interface SessionRequest {
  unit: 'min' | 'ball';
  amount: number;              // minutes, or balls
  symptomId: string | null;    // null = let the app choose; 'preround' = pre-round mode
  facility: Facility;
  recentDrillIds: string[];    // drills done in the last 3 sessions
  seed?: number;
}
export interface SessionPlan {
  drillIds: string[];
  used: number;                // minutes or balls used by the drills
  freeHit: number;             // balls left for free hitting (ball mode only)
  notices: string[];
}

/** Areas that need the practice green or a bunker. */
export function needsGreen(area: Area) { return area === 'putt' || area === 'chip'; }

export function drillAvailable(d: Drill, f: Facility) {
  if (needsGreen(d.area) && !f.green) return false;
  if (d.area === 'bunker' && !f.bunker) return false;
  return true;
}

/** Ball mode is a range-bay session: only full-swing drills use tray balls. */
export function fullSwing(d: Drill) { return d.area === 'driver' || d.area === 'iron'; }

export function symptomAvailable(s: Symptom, f: Facility, unit: 'min' | 'ball') {
  if (unit === 'ball') return s.area === 'driver' || s.area === 'iron';
  if (needsGreen(s.area) && !f.green) return false;
  if (s.area === 'bunker' && !f.bunker) return false;
  return true;
}

function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(xs: T[], rand: () => number) {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const cost = (d: Drill, unit: 'min' | 'ball') => (unit === 'min' ? d.minutes : d.balls ?? 0);

export function buildSession(req: SessionRequest, drills: Drill[] = DRILLS): SessionPlan {
  const rand = rng(req.seed ?? Date.now());
  const notices: string[] = [];
  let pool = drills.filter((d) => drillAvailable(d, req.facility));
  if (req.unit === 'ball') pool = pool.filter(fullSwing);

  const warmups = pool.filter((d) => d.isWarmup);
  let mains: Drill[];

  if (req.symptomId === PREROUND) {
    // Pre-round: warm up and build confidence, no swing changes.
    const order = ['tee-gate-driver', 'putt-gate', 'clock-drill', 'landing-towel'];
    mains = order.map((id) => pool.find((d) => d.id === id)).filter((d): d is Drill => !!d);
  } else {
    const nonWarm = pool.filter((d) => !d.isWarmup);
    const matching = req.symptomId ? nonWarm.filter((d) => d.symptoms.includes(req.symptomId!)) : nonWarm;
    if (req.symptomId && matching.length === 0) {
      notices.push('ไม่มีดริลที่ตรงอาการนี้ในสถานที่ที่เลือก จึงใช้ดริลอื่นแทน');
      mains = nonWarm;
    } else {
      mains = matching;
    }
    const recent = new Set(req.recentDrillIds);
    const fresh = shuffle(mains.filter((d) => !recent.has(d.id)), rand);
    const seen = shuffle(mains.filter((d) => recent.has(d.id)), rand);
    mains = [...fresh, ...seen];
  }

  const plan: Drill[] = [];
  let used = 0;
  const skipWarmup = req.unit === 'min' ? req.amount <= 10 : req.amount < BALLS_PER_TRAY;
  if (!skipWarmup && warmups.length) {
    const w = warmups.find((d) => d.id === 'setup-alignment') ?? warmups[0];
    if (cost(w, req.unit) <= req.amount) { plan.push(w); used += cost(w, req.unit); }
  }
  for (const d of mains) {
    const c = cost(d, req.unit);
    if (used + c <= req.amount) { plan.push(d); used += c; }
  }
  if (plan.filter((d) => !d.isWarmup).length === 0 && mains.length) {
    // Budget too small for any main drill: still give one, shortened.
    plan.push(mains[0]);
    used = Math.min(req.amount, used + cost(mains[0], req.unit));
    notices.push('เวลาน้อยกว่าดริลหลัก ทำเท่าที่ทำได้');
  }
  if (plan.length === 0) notices.push('ไม่มีดริลที่ทำได้ ลองเปลี่ยนการตั้งค่าสถานที่');

  const freeHit = req.unit === 'ball' ? Math.max(0, req.amount - used) : 0;
  if (req.unit === 'min' && used < req.amount * 0.8 && plan.length) {
    notices.push(`มีดริลไม่พอเต็มเวลา รวม ${used} จาก ${req.amount} นาที`);
  }
  return { drillIds: plan.map((d) => d.id), used, freeHit, notices };
}

/** R4: suggest a symptom from recent shots. Needs at least 10 shots. */
export function suggestSymptom(recentFlights: Flight[]): 'slice' | 'hook' | null {
  const last = recentFlights.slice(-30);
  if (last.length < 10) return null;
  const right = last.filter((f) => f === 'slice' || f === 'fade').length / last.length;
  const left = last.filter((f) => f === 'hook' || f === 'draw').length / last.length;
  if (right >= 0.4 && right >= left) return 'slice';
  if (left >= 0.4) return 'hook';
  return null;
}

export function straightPct(flights: Flight[]): number | null {
  if (!flights.length) return null;
  return Math.round((flights.filter((f) => f === 'straight').length / flights.length) * 100);
}
