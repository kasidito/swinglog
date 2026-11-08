import { describe, expect, it } from 'vitest';
import manifestData from '../docs/coaching/media-manifest.json';
import { DRILLS } from './engine';
import { FOUNDATIONS, LESSONS, lessonById, mediaDirections, mirrorImage, targetLabel } from './coaching';
import { parseBackup } from './App';
import { defaultState } from './store';

describe('instructional content integrity', () => {
  it('covers every legacy drill ID exactly once and has six foundations', () => {
    expect(FOUNDATIONS).toHaveLength(6);
    expect(new Set(LESSONS.map(l => l.id)).size).toBe(26);
    expect(LESSONS.filter(l => l.kind === 'drill').map(l => l.id).sort()).toEqual(DRILLS.map(d => d.id).sort());
    for (const d of DRILLS) expect(lessonById(d.id)!.steps.length).toBeGreaterThanOrEqual(3);
  });
  it('has actionable steps, self-checks, references, valid image frames and related lessons', () => {
    for (const lesson of LESSONS) {
      expect(lesson.sources.length).toBeGreaterThan(0);
      for (const s of lesson.sources) expect(new URL(s.url).protocol).toBe('https:');
      for (const related of lesson.related) expect(lessonById(related)?.kind).toBe('foundation');
      for (const step of lesson.steps) {
        expect(step.action.length).toBeGreaterThan(5);
        expect(step.check.length).toBeGreaterThan(5);
        expect(step.alt.length).toBeGreaterThan(10);
        expect([0, 1, 2]).toContain(step.frame);
        expect(manifestData.some(a => a.file === `public/coaching/${step.image ?? lesson.id}.webp`)).toBe(true);
        expect(mediaDirections[step.image ?? lesson.id]).toBeDefined();
      }
    }
  });
  it('records exact prompts and separates visual screening from human verification', () => {
    const manifest = manifestData;
    for (const lesson of LESSONS) {
      const asset = manifest.find((a: { id: string }) => a.id === lesson.id);
      expect(asset!.prompt.length).toBeGreaterThan(100);
      expect(asset!.review.professional).toBe('not-performed');
      expect(asset!.review.beginnerComprehension).toBe('not-performed');
    }
  });
  it('normalizes source handedness before adapting target direction for each user', () => {
    expect(mirrorImage('towel-low-point', false)).toBe(true);
    expect(mirrorImage('towel-low-point', true)).toBe(false);
    expect(mirrorImage('club-setup', false)).toBe(false);
    expect(targetLabel(lessonById('club-setup')!, false)).toContain('ขวา');
    expect(targetLabel(lessonById('club-setup')!, true)).toContain('ซ้าย');
    expect(targetLabel(lessonById('towel-low-point')!, false)).toContain('ขวา');
  });
});

describe('backward-compatible coaching progress', () => {
  it('loads an old backup without changing session IDs, drill IDs or shots', () => {
    const old = { ...defaultState(), sessions: [{ id: 'old', drillIds: ['path-gate'], doneDrillIds: ['path-gate'] }], shots: [{ id: 'shot', drillId: 'path-gate', flight: 'straight' }] };
    const parsed = parseBackup(JSON.stringify(old))!;
    expect(parsed.sessions).toEqual(old.sessions);
    expect(parsed.shots).toEqual(old.shots);
    expect(parsed.coachingProgress).toEqual({});
  });
  it('exports/restores valid progress and drops invalid or obsolete lesson steps', () => {
    const parsed = parseBackup(JSON.stringify({ ...defaultState(), coachingProgress: { grip: 1, 'path-gate': 2, obsolete: 1, posture: -1, alignment: 99 } }))!;
    expect(parsed.coachingProgress).toEqual({ grip: 1, 'path-gate': 2 });
  });
});
