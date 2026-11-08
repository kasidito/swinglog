/**
 * Original top-down station diagrams for each drill: where the ball, feet, sticks, tees,
 * towel and hole go. Target is always up. Coordinates are in a 200 x 150 box,
 * drawn for a right-handed golfer and mirrored for left-handers.
 */
type El =
  | { t: 'ball'; x: number; y: number; ghost?: boolean }
  | { t: 'feet'; x: number; y: number; gap?: number; ghost?: boolean }
  | { t: 'stick'; x1: number; y1: number; x2: number; y2: number }
  | { t: 'tee'; x: number; y: number }
  | { t: 'towel'; x: number; y: number; w: number; h: number }
  | { t: 'hole'; x: number; y: number }
  | { t: 'line'; x1: number; y1: number; x2: number; y2: number; kind?: 'dash' | 'path' | 'club' }
  | { t: 'curve'; d: string }
  | { t: 'zone'; x: number; y: number; w: number; h: number; kind: 'sand' | 'green' | 'good' }
  | { t: 'text'; x: number; y: number; s: string }
  | { t: 'grip'; gap: number };

const B = { x: 112, y: 100 }; // default ball
const F = { x: 80, y: 100 };  // default feet centre

export const DIAGRAMS: Record<string, El[]> = {
  'setup-alignment': [
    { t: 'stick', x1: 66, y1: 22, x2: 66, y2: 138 }, { t: 'stick', x1: 130, y1: 22, x2: 130, y2: 138 },
    { t: 'feet', ...F }, { t: 'ball', ...B }, { t: 'text', x: 66, y: 146, s: 'แนวเท้า' }, { t: 'text', x: 130, y: 146, s: 'แนวเป้า' },
  ],
  'half-swing-warmup': [
    { t: 'feet', ...F }, { t: 'ball', ...B }, { t: 'curve', d: 'M112 128 A 34 34 0 0 1 112 72' }, { t: 'text', x: 150, y: 104, s: 'ครึ่งวง' },
  ],
  'path-gate': [
    { t: 'feet', ...F }, { t: 'ball', ...B },
    { t: 'stick', x1: 98, y1: 132, x2: 98, y2: 68 }, { t: 'stick', x1: 126, y1: 132, x2: 126, y2: 68 },
    { t: 'line', x1: 112, y1: 132, x2: 112, y2: 68, kind: 'path' }, { t: 'text', x: 156, y: 66, s: 'ช่องให้หัวไม้ผ่าน' },
  ],
  'anti-slice-stick': [
    { t: 'feet', ...F }, { t: 'ball', ...B }, { t: 'stick', x1: 140, y1: 126, x2: 132, y2: 80 },
    { t: 'line', x1: 128, y1: 128, x2: 104, y2: 74, kind: 'path' }, { t: 'text', x: 154, y: 66, s: 'ไม้ราบพ้นทาง' },
  ],
  'split-grip': [{ t: 'grip', gap: 26 }],
  'feet-together': [{ t: 'feet', x: 84, y: 100, gap: 2 }, { t: 'ball', x: 108, y: 100 }, { t: 'text', x: 84, y: 136, s: 'เท้าชิด' }],
  'towel-low-point': [
    { t: 'feet', ...F }, { t: 'ball', ...B }, { t: 'towel', x: 100, y: 112, w: 24, h: 10 },
    { t: 'text', x: 150, y: 120, s: 'ผ้า 15 ซม.' }, { t: 'text', x: 150, y: 132, s: 'หลังลูก' },
  ],
  'line-drill': [
    { t: 'feet', ...F }, { t: 'zone', x: 98, y: 80, w: 30, h: 20, kind: 'good' },
    { t: 'line', x1: 92, y1: 100, x2: 150, y2: 100, kind: 'dash' }, { t: 'ball', ...B }, { t: 'text', x: 162, y: 86, s: 'รอยไม้ตรงนี้' },
  ],
  'step-through': [
    { t: 'feet', x: 80, y: 112, gap: 2 }, { t: 'feet', x: 80, y: 52, gap: 2, ghost: true }, { t: 'ball', x: 106, y: 112 },
    { t: 'curve', d: 'M68 104 C 54 90 54 74 68 62' }, { t: 'text', x: 36, y: 86, s: 'ก้าวตาม' },
  ],
  'tee-gate-driver': [
    { t: 'feet', x: 76, y: 100 }, { t: 'ball', ...B }, { t: 'tee', x: 112, y: 100 }, { t: 'tee', x: 98, y: 100 },
    { t: 'text', x: 140, y: 124, s: 'ทีกันปลายไม้' }, { t: 'line', x1: 98, y1: 104, x2: 128, y2: 118, kind: 'dash' },
  ],
  'putt-gate': [
    { t: 'zone', x: 0, y: 0, w: 200, h: 150, kind: 'green' }, { t: 'hole', x: 112, y: 22 }, { t: 'feet', ...F }, { t: 'ball', ...B },
    { t: 'tee', x: 106, y: 88 }, { t: 'tee', x: 118, y: 88 }, { t: 'line', x1: 112, y1: 92, x2: 112, y2: 28, kind: 'dash' },
  ],
  'clock-drill': [
    { t: 'zone', x: 0, y: 0, w: 200, h: 150, kind: 'green' }, { t: 'hole', x: 100, y: 75 },
    ...[0, 45, 90, 135, 180, 225, 270, 315].map((a) => ({ t: 'ball' as const, x: 100 + 44 * Math.cos((a * Math.PI) / 180), y: 75 + 44 * Math.sin((a * Math.PI) / 180) })),
    { t: 'text', x: 160, y: 140, s: 'ห่าง 1 ม.' },
  ],
  'ladder-369': [
    { t: 'zone', x: 0, y: 0, w: 200, h: 150, kind: 'green' }, { t: 'hole', x: 100, y: 16 },
    { t: 'tee', x: 100, y: 52 }, { t: 'ball', x: 100, y: 58 }, { t: 'tee', x: 100, y: 88 }, { t: 'ball', x: 100, y: 94 }, { t: 'tee', x: 100, y: 124 }, { t: 'ball', x: 100, y: 130 },
    { t: 'text', x: 132, y: 58, s: '1 ม.' }, { t: 'text', x: 132, y: 94, s: '2 ม.' }, { t: 'text', x: 132, y: 130, s: '3 ม.' },
  ],
  'lag-ladder': [
    { t: 'zone', x: 0, y: 0, w: 200, h: 150, kind: 'green' }, { t: 'ball', x: 100, y: 138 },
    ...[110, 80, 50, 20].map((y) => ({ t: 'tee' as const, x: 100, y })),
    { t: 'text', x: 130, y: 112, s: '3 ม.' }, { t: 'text', x: 130, y: 82, s: '6 ม.' }, { t: 'text', x: 130, y: 52, s: '9 ม.' }, { t: 'text', x: 130, y: 22, s: '12 ม.' },
  ],
  'lag-safe-zone': [
    { t: 'zone', x: 0, y: 0, w: 200, h: 150, kind: 'green' }, { t: 'zone', x: 84, y: 22, w: 32, h: 20, kind: 'good' },
    { t: 'line', x1: 76, y1: 20, x2: 124, y2: 20, kind: 'club' }, { t: 'hole', x: 100, y: 44 }, { t: 'ball', x: 100, y: 136 },
    { t: 'line', x1: 100, y1: 130, x2: 100, y2: 34, kind: 'dash' }, { t: 'text', x: 44, y: 22, s: 'ไม้กอล์ฟ' }, { t: 'text', x: 44, y: 36, s: 'หยุดในช่องนี้' },
  ],
  'landing-towel': [
    { t: 'zone', x: 0, y: 0, w: 200, h: 104, kind: 'green' }, { t: 'towel', x: 88, y: 76, w: 24, h: 12 }, { t: 'hole', x: 100, y: 24 },
    { t: 'ball', x: 100, y: 132 }, { t: 'curve', d: 'M100 128 Q 96 104 100 84' }, { t: 'line', x1: 100, y1: 76, x2: 100, y2: 30, kind: 'dash' },
    { t: 'text', x: 146, y: 84, s: 'จุดตก (ผ้า)' }, { t: 'text', x: 146, y: 116, s: 'ขอบกรีน' },
  ],
  'landing-club-ladder': [
    { t: 'zone', x: 0, y: 0, w: 200, h: 104, kind: 'green' }, { t: 'towel', x: 88, y: 76, w: 24, h: 12 }, { t: 'ball', x: 100, y: 132 },
    { t: 'line', x1: 80, y1: 76, x2: 80, y2: 54, kind: 'dash' }, { t: 'line', x1: 100, y1: 76, x2: 100, y2: 36, kind: 'dash' }, { t: 'line', x1: 120, y1: 76, x2: 120, y2: 14, kind: 'dash' },
    { t: 'text', x: 80, y: 48, s: 'PW' }, { t: 'text', x: 100, y: 30, s: '8' }, { t: 'text', x: 120, y: 10, s: '6' },
  ],
  'bunker-line': [
    { t: 'zone', x: 0, y: 30, w: 200, h: 120, kind: 'sand' }, { t: 'feet', x: 70, y: 100 },
    { t: 'line', x1: 96, y1: 132, x2: 96, y2: 50, kind: 'dash' },
    ...[58, 86, 114].map((y) => ({ t: 'ball' as const, x: 104, y })), { t: 'text', x: 150, y: 140, s: 'เส้นในทราย' },
  ],
  'bunker-bill': [
    { t: 'zone', x: 0, y: 30, w: 200, h: 120, kind: 'sand' }, { t: 'feet', x: 78, y: 96 },
    { t: 'zone', x: 100, y: 78, w: 22, h: 40, kind: 'good' }, { t: 'ball', x: 111, y: 96 }, { t: 'text', x: 156, y: 100, s: 'ยาวเท่าธนบัตร' },
  ],
  'bunker-tee-entry': [
    { t: 'zone', x: 0, y: 30, w: 200, h: 120, kind: 'sand' }, { t: 'feet', x: 78, y: 96 }, { t: 'ball', x: 111, y: 96 },
    { t: 'tee', x: 138, y: 110 }, { t: 'tee', x: 138, y: 70 }, { t: 'text', x: 166, y: 112, s: 'แนวเข้า' }, { t: 'text', x: 166, y: 72, s: 'แนวออก' },
    { t: 'line', x1: 111, y1: 122, x2: 111, y2: 60, kind: 'path' }, { t: 'text', x: 105, y: 144, s: 'วางทีข้างทางหัวไม้' },
  ],
};

function Shape({ e }: { e: El }) {
  switch (e.t) {
    case 'ball': return <circle cx={e.x} cy={e.y} r="4.5" className={e.ghost ? 'd-ball ghost' : 'd-ball'} />;
    case 'feet': {
      const g = e.gap ?? 14;
      return (
        <g className={e.ghost ? 'd-feet ghost' : 'd-feet'}>
          <rect x={e.x - 7} y={e.y - g / 2 - 22} width="14" height="22" rx="7" />
          <rect x={e.x - 7} y={e.y + g / 2} width="14" height="22" rx="7" />
        </g>
      );
    }
    case 'stick': return <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} className="d-stick" />;
    case 'tee': return <circle cx={e.x} cy={e.y} r="2.6" className="d-tee" />;
    case 'towel': return <rect x={e.x} y={e.y} width={e.w} height={e.h} rx="2" className="d-towel" />;
    case 'hole': return <circle cx={e.x} cy={e.y} r="6" className="d-hole" />;
    case 'line': return <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} className={`d-${e.kind ?? 'dash'}`} />;
    case 'curve': return <path d={e.d} className="d-path" markerEnd="url(#d-arrow)" />;
    case 'zone': return <rect x={e.x} y={e.y} width={e.w} height={e.h} rx={e.kind === 'good' ? 3 : 0} className={`d-zone-${e.kind}`} />;
    case 'grip':
      return (
        <g>
          <line x1="40" y1="40" x2="170" y2="118" className="d-club" />
          <ellipse cx="62" cy="53" rx="13" ry="9" className="d-hand" transform="rotate(31 62 53)" />
          <ellipse cx={62 + e.gap * 0.86} cy={53 + e.gap * 0.52} rx="13" ry="9" className="d-hand" transform={`rotate(31 ${62 + e.gap * 0.86} ${53 + e.gap * 0.52})`} />
        </g>
      );
    default: return null;
  }
}

export default function DrillDiagram({ id, left = false }: { id: string; left?: boolean }) {
  const els = DIAGRAMS[id];
  if (!els) return null;
  const shapes = els.filter((e) => e.t !== 'text');
  const texts = els.filter((e): e is Extract<El, { t: 'text' }> => e.t === 'text');
  const isGrip = id === 'split-grip';
  return (
    <figure className="diagram">
      <svg viewBox="0 0 200 150" role="img" aria-label="แผนผังการวางอุปกรณ์ของดริลนี้ มองจากด้านบน">
        <defs>
          <marker id="d-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" className="d-arrowhead" /></marker>
        </defs>
        <rect x="0" y="0" width="200" height="150" className="d-bg" />
        <g transform={left && !isGrip ? 'translate(200,0) scale(-1,1)' : undefined}>
          {shapes.map((e, i) => <Shape key={i} e={e} />)}
        </g>
        {!isGrip && <g className="d-target"><line x1="186" y1="40" x2="186" y2="12" markerEnd="url(#d-arrow)" /><text x="186" y="52">เป้า</text></g>}
        {texts.map((e, i) => <text key={i} x={left && !isGrip ? 200 - e.x : e.x} y={e.y} className="d-text">{e.s}</text>)}
        {isGrip && <text x="120" y="40" className="d-text">มือห่างกันประมาณ 1 ฝ่ามือ</text>}
      </svg>
      <figcaption className="muted">{isGrip ? 'การจับไม้' : 'มองจากด้านบน ลูกศรชี้ไปทางเป้า'}</figcaption>
    </figure>
  );
}
