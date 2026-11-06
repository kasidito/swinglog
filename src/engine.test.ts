import { describe, expect, it } from 'vitest';
import { DRILLS, SYMPTOMS, buildSession, suggestSymptom, straightPct, PREROUND, Flight, symptomAvailable } from './engine';

const all = { green: true, bunker: true };
const none = { green: false, bunker: false };
const byId = (id: string) => DRILLS.find((d) => d.id === id)!;
const total = (ids: string[], key: 'minutes' | 'balls') => ids.reduce((s, id) => s + (byId(id)[key] ?? 0), 0);

describe('content', () => {
  it('every drill symptom exists', () => {
    const ids = new Set(SYMPTOMS.map((s) => s.id));
    for (const d of DRILLS) for (const s of d.symptoms) expect(ids.has(s)).toBe(true);
  });
  it('every drill has 3-6 steps and a goal', () => {
    for (const d of DRILLS) {
      expect(d.steps.length).toBeGreaterThanOrEqual(3);
      expect(d.steps.length).toBeLessThanOrEqual(6);
      expect(d.goal.length).toBeGreaterThan(0);
    }
  });
  it('drill ids are unique', () => {
    expect(new Set(DRILLS.map((d) => d.id)).size).toBe(DRILLS.length);
  });
  it('every drill has at least 2 sources', () => {
    const weak = DRILLS.filter((d) => d.sources.length < 2).map((d) => d.id);
    expect(weak).toEqual([]);
  });
});

describe('buildSession', () => {
  it('never exceeds the minutes chosen', () => {
    for (const amount of [10, 15, 30]) for (const s of SYMPTOMS) for (let seed = 1; seed < 20; seed++) {
      const p = buildSession({ unit: 'min', amount, symptomId: s.id, facility: all, recentDrillIds: [], seed });
      expect(p.used).toBeLessThanOrEqual(amount);
      expect(total(p.drillIds, 'minutes')).toBe(p.used);
    }
  });
  it('fills at least 80% of 15 minutes for slice', () => {
    const p = buildSession({ unit: 'min', amount: 15, symptomId: 'slice', facility: all, recentDrillIds: [], seed: 3 });
    expect(p.used).toBeGreaterThanOrEqual(12);
  });
  it('starts with a warm-up except for 10 minutes', () => {
    const p15 = buildSession({ unit: 'min', amount: 15, symptomId: 'contact', facility: all, recentDrillIds: [], seed: 1 });
    expect(byId(p15.drillIds[0]).isWarmup).toBe(true);
    const p10 = buildSession({ unit: 'min', amount: 10, symptomId: 'contact', facility: all, recentDrillIds: [], seed: 1 });
    expect(p10.drillIds.some((id) => byId(id).isWarmup)).toBe(false);
  });
  it('only picks drills matching the symptom (besides warm-up)', () => {
    const p = buildSession({ unit: 'min', amount: 30, symptomId: 'hook', facility: all, recentDrillIds: [], seed: 5 });
    for (const id of p.drillIds) {
      const d = byId(id);
      if (!d.isWarmup) expect(d.symptoms).toContain('hook');
    }
  });
  it('prefers drills not done in recent sessions', () => {
    const p = buildSession({ unit: 'min', amount: 10, symptomId: 'contact', facility: all, recentDrillIds: ['towel-low-point', 'line-drill'], seed: 2 });
    expect(p.drillIds[0]).not.toBe('towel-low-point');
    expect(p.drillIds[0]).not.toBe('line-drill');
  });
  it('excludes putting and chipping without a green, bunker without a bunker', () => {
    for (let seed = 1; seed < 10; seed++) {
      const p = buildSession({ unit: 'min', amount: 30, symptomId: null, facility: none, recentDrillIds: [], seed });
      for (const id of p.drillIds) expect(['driver', 'iron']).toContain(byId(id).area);
    }
  });
  it('falls back with a notice when the symptom has no drill at this facility', () => {
    const p = buildSession({ unit: 'min', amount: 15, symptomId: 'short_putt', facility: none, recentDrillIds: [], seed: 1 });
    expect(p.notices.length).toBeGreaterThan(0);
    expect(p.drillIds.length).toBeGreaterThan(0);
  });
  it('ball mode uses only full-swing drills and leaves the rest for free hitting', () => {
    const p = buildSession({ unit: 'ball', amount: 40, symptomId: 'slice', facility: all, recentDrillIds: [], seed: 4 });
    for (const id of p.drillIds) expect(['driver', 'iron']).toContain(byId(id).area);
    expect(total(p.drillIds, 'balls')).toBe(p.used);
    expect(p.used + p.freeHit).toBe(40);
  });
  it('pre-round mode gives warm-up, driver and putting when a green exists', () => {
    const p = buildSession({ unit: 'min', amount: 30, symptomId: PREROUND, facility: all, recentDrillIds: [], seed: 1 });
    expect(p.drillIds).toContain('tee-gate-driver');
    expect(p.drillIds).toContain('putt-gate');
    expect(byId(p.drillIds[0]).isWarmup).toBe(true);
  });
  it('is deterministic for a given seed', () => {
    const r = { unit: 'min' as const, amount: 30, symptomId: null, facility: all, recentDrillIds: [], seed: 42 };
    expect(buildSession(r).drillIds).toEqual(buildSession(r).drillIds);
  });
});

describe('symptomAvailable', () => {
  it('hides short-game symptoms in ball mode and without facilities', () => {
    const putt = SYMPTOMS.find((s) => s.id === 'short_putt')!;
    expect(symptomAvailable(putt, all, 'ball')).toBe(false);
    expect(symptomAvailable(putt, none, 'min')).toBe(false);
    expect(symptomAvailable(putt, all, 'min')).toBe(true);
  });
});

describe('suggestSymptom', () => {
  const rep = (f: Flight, n: number) => Array<Flight>(n).fill(f);
  it('needs 10 shots', () => expect(suggestSymptom(rep('slice', 9))).toBeNull());
  it('suggests slice at 40% right-curving', () => {
    expect(suggestSymptom([...rep('slice', 3), ...rep('fade', 1), ...rep('straight', 6)])).toBe('slice');
  });
  it('suggests hook at 40% left-curving', () => {
    expect(suggestSymptom([...rep('hook', 4), ...rep('straight', 6)])).toBe('hook');
  });
  it('returns null when mostly straight', () => {
    expect(suggestSymptom([...rep('slice', 2), ...rep('straight', 8)])).toBeNull();
  });
  it('straightPct', () => {
    expect(straightPct([])).toBeNull();
    expect(straightPct(['straight', 'slice', 'straight', 'hook'])).toBe(50);
  });
});

import { parseBackup } from './App';
describe('parseBackup', () => {
  it('accepts a SwingLog export and rejects anything else', () => {
    const ok = JSON.stringify({ schemaVersion: 1, settings: { handedness: 'left' }, sessions: [], shots: [] });
    expect(parseBackup(ok)?.settings.handedness).toBe('left');
    expect(parseBackup(ok)?.settings.hasGreen).toBe(true);
    expect(parseBackup('{"foo":1}')).toBeNull();
    expect(parseBackup('not json')).toBeNull();
  });
});
