export type GuideIconKind = 'left' | 'right' | 'up' | 'external' | 'zoom';
export default function GuideIcon({ kind }: { kind: GuideIconKind }) {
  const path = kind === 'external' ? 'M14 4h6v6M20 4L10 14M20 14v6H4V4h6'
    : kind === 'zoom' ? 'M16 16l5 5M10 7v6M7 10h6M17 10a7 7 0 1 1-14 0a7 7 0 0 1 14 0'
    : 'M4 12h16M14 6l6 6-6 6';
  return <svg className="guide-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: kind === 'left' ? 'rotate(180deg)' : kind === 'up' ? 'rotate(-90deg)' : undefined }}><path d={path} /></svg>;
}
