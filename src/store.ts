import { get, set } from 'idb-keyval';
import type { Flight } from './engine';

export interface Settings {
  handedness: 'right' | 'left';
  hasGreen: boolean;
  hasBunker: boolean;
  theme: 'light' | 'dark' | 'auto';
  largeText: boolean;
  lastUnit: 'min' | 'ball';
  lastAmount: number;
}

export interface Session {
  id: string;
  startedAt: string;
  endedAt: string | null;
  unit: 'min' | 'ball';
  amount: number;
  mode: 'normal' | 'preround';
  symptomId: string | null;
  drillIds: string[];
  doneDrillIds: string[];
  freeHit: number;
  status: 'active' | 'completed' | 'abandoned';
}

export interface Shot { id: string; sessionId: string; drillId: string; flight: Flight; createdAt: string }

export interface AppState { schemaVersion: 1; settings: Settings; sessions: Session[]; shots: Shot[] }

export const defaultState = (): AppState => ({
  schemaVersion: 1,
  settings: { handedness: 'right', hasGreen: true, hasBunker: false, theme: 'dark', largeText: false, lastUnit: 'min', lastAmount: 15 },
  sessions: [],
  shots: [],
});

const KEY = 'golf-practice-v1'; // kept after the SwingLog rename so existing data still loads
let persistent = true;

export async function load(): Promise<AppState> {
  try {
    const s = (await get(KEY)) as AppState | undefined;
    if (s && s.schemaVersion === 1) return { ...defaultState(), ...s, settings: { ...defaultState().settings, ...s.settings } };
  } catch {
    persistent = false; // storage blocked: keep working in memory
  }
  return defaultState();
}

export async function save(state: AppState): Promise<void> {
  if (!persistent) return;
  try {
    await set(KEY, state);
  } catch {
    persistent = false;
  }
}

export function isPersistent() { return persistent; }

export async function requestPersist() {
  try { await navigator.storage?.persist?.(); } catch { /* not supported */ }
}

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
