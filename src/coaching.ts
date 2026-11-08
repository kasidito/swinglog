import data from './content/coaching.json';
import directions from './content/media-directions.json';
import type { Source } from './engine';

export interface InstructionStep {
  action: string; check: string; alt: string; frame: number; focus: string; image?: string;
}
export interface Lesson {
  id: string; title: string; kind: 'foundation' | 'drill'; related: string[];
  camera: 'front' | 'top' | 'side' | 'detail'; sources: Source[]; steps: InstructionStep[];
}
export const LESSONS = data as Lesson[];
export const FOUNDATIONS = LESSONS.filter(l => l.kind === 'foundation');
export const lessonById = (id: string) => LESSONS.find(l => l.id === id);
export const imageUrl = (id: string) => `${import.meta.env.BASE_URL}coaching/${id}.webp`;
export const mediaDirections = directions as Record<string, { hand: 'left' | 'right'; target: string }>;
export const mirrorImage = (id: string, left: boolean) => (mediaDirections[id]?.hand === 'left') !== left;
export function handTerms(left: boolean) {
  return `ข้างนำ = ${left ? 'ขวา' : 'ซ้าย'} · ข้างตาม = ${left ? 'ซ้าย' : 'ขวา'}`;
}
export function targetLabel(lesson: Lesson, left: boolean) {
  const target = mediaDirections[lesson.id]?.target;
  if (target === 'detail') return 'ดูการสัมผัสมือกับกริป · ลูกอยู่นอกภาพ';
  if (target === 'depth') return 'เป้า: ตั้งฉากกับภาพด้านข้าง';
  if (target === 'hole') return 'เป้า: หลุมที่แสดงในภาพ';
  if (target === 'up') return 'เป้า: ด้านบนของภาพ';
  const toLeft = (target === 'left') !== mirrorImage(lesson.id, left);
  return `เป้า: ${toLeft ? 'ซ้าย' : 'ขวา'}ของภาพ`;
}
export function targetDirection(lesson: Lesson, left: boolean): 'left' | 'right' | 'up' | undefined {
  const target = mediaDirections[lesson.id]?.target;
  if (target === 'up') return 'up';
  if (target !== 'left' && target !== 'right') return undefined;
  return (target === 'left') !== mirrorImage(lesson.id, left) ? 'left' : 'right';
}
