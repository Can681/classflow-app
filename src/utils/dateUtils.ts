import { AppSettings, Course, TimeSlot } from '../types/schedule';

export const DAY_NAMES_SHORT = ['一', '二', '三', '四', '五', '六', '日'];
export const DAY_NAMES_FULL = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export function parseYMD(ymd: string): Date {
  const parts = ymd.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return new Date();
  }
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

export function formatYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 1 = Monday ... 7 = Sunday */
export function getIsoWeekday(d: Date = new Date()): number {
  const g = d.getDay();
  return g === 0 ? 7 : g;
}

/**
 * Compute current semester week (1-based) from semesterStartDate.
 */
export function getCurrentWeek(semesterStartDate: string, totalWeeks = 20, now: Date = new Date()): number {
  const start = parseYMD(semesterStartDate);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.floor((today.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  const rawWeek = Math.floor(diffDays / 7) + 1;
  return Math.max(1, Math.min(totalWeeks, rawWeek));
}

/**
 * Get calendar Date for a given (week, day 1..7).
 */
export function getDateForWeekDay(semesterStartDate: string, week: number, day: number): Date {
  const start = parseYMD(semesterStartDate);
  const offsetDays = (week - 1) * 7 + (day - 1);
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + offsetDays);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
}

export function timeToSeconds(hhmm: string): number {
  return timeToMinutes(hhmm) * 60;
}

export function getCourseTimeRange(course: Course, timeSlots: TimeSlot[]): { start: string; end: string } {
  const startSlot = timeSlots.find((t) => t.section === course.startSection);
  const endSlot = timeSlots.find((t) => t.section === course.endSection);
  return {
    start: startSlot?.startTime ?? '08:00',
    end: endSlot?.endTime ?? '09:40',
  };
}

export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  if (h > 0) {
    return `${h}小时 ${String(m).padStart(2, '0')}分 ${String(s).padStart(2, '0')}秒`;
  }
  return `${String(m).padStart(2, '0')}分 ${String(s).padStart(2, '0')}秒`;
}

export interface LiveClassStatus {
  mode: 'in_class' | 'upcoming' | 'done' | 'free';
  course?: Course;
  nextCourse?: Course;
  remainingSeconds: number;
  progress: number; // 0..1 when in_class
  timeRange?: { start: string; end: string };
}

export function computeLiveStatus(
  todayCourses: Course[],
  tomorrowCourses: Course[],
  timeSlots: TimeSlot[],
  now: Date = new Date()
): LiveClassStatus {
  const nowSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const sorted = [...todayCourses].sort((a, b) => a.startSection - b.startSection);

  if (sorted.length === 0) {
    const firstTomorrow = [...tomorrowCourses].sort((a, b) => a.startSection - b.startSection)[0];
    return {
      mode: 'free',
      nextCourse: firstTomorrow,
      remainingSeconds: 0,
      progress: 0,
    };
  }

  for (let i = 0; i < sorted.length; i++) {
    const c = sorted[i];
    const range = getCourseTimeRange(c, timeSlots);
    const startSec = timeToSeconds(range.start);
    const endSec = timeToSeconds(range.end);

    if (nowSecs >= startSec && nowSecs <= endSec) {
      const duration = Math.max(1, endSec - startSec);
      return {
        mode: 'in_class',
        course: c,
        nextCourse: sorted[i + 1],
        remainingSeconds: endSec - nowSecs,
        progress: Math.min(1, Math.max(0, (nowSecs - startSec) / duration)),
        timeRange: range,
      };
    }
    if (nowSecs < startSec) {
      return {
        mode: 'upcoming',
        course: c,
        remainingSeconds: startSec - nowSecs,
        progress: 0,
        timeRange: range,
      };
    }
  }

  const firstTomorrow = [...tomorrowCourses].sort((a, b) => a.startSection - b.startSection)[0];
  return {
    mode: 'done',
    nextCourse: firstTomorrow,
    remainingSeconds: 0,
    progress: 1,
  };
}

/**
 * Format week numbers array into concise Chinese readable text, e.g. "1-16周" or "1-15单周".
 */
export function formatWeeksText(weeks: number[]): string {
  if (!weeks || weeks.length === 0) return '未设置周次';
  const sorted = Array.from(new Set(weeks)).sort((a, b) => a - b);
  if (sorted.length === 1) return `第${sorted[0]}周`;

  const allOdd = sorted.every((w) => w % 2 === 1);
  const allEven = sorted.every((w) => w % 2 === 0);

  if ((allOdd || allEven) && sorted.length >= 2) {
    let contiguousStep2 = true;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] !== 2) {
        contiguousStep2 = false;
        break;
      }
    }
    if (contiguousStep2) {
      return `${sorted[0]}-${sorted[sorted.length - 1]}${allOdd ? '单' : '双'}周`;
    }
  }

  const parts: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === prev + 1) {
      prev = sorted[i];
    } else {
      parts.push(start === prev ? `${start}` : `${start}-${prev}`);
      start = sorted[i];
      prev = sorted[i];
    }
  }
  parts.push(start === prev ? `${start}` : `${start}-${prev}`);
  return `${parts.join(', ')}周`;
}

/**
 * Parse Chinese week expressions like "1-16周(单), 18周", "2-14双", "1,3,5-9周" into sorted week numbers.
 */
export function parseWeekExpression(expr: string, maxWeek = 24): number[] {
  if (!expr) return Array.from({ length: 16 }, (_, i) => i + 1);
  const cleaned = expr
    .replace(/第/g, '')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/，/g, ',')
    .replace(/、/g, ',')
    .replace(/~/g, '-')
    .replace(/至/g, '-');

  const result = new Set<number>();
  const segments = cleaned.split(',').map((s) => s.trim()).filter(Boolean);

  for (const seg of segments) {
    const isOdd = seg.includes('单');
    const isEven = seg.includes('双');
    const rangeMatch = seg.match(/(\d+)\s*-\s*(\d+)/);
    if (rangeMatch) {
      const a = Math.max(1, parseInt(rangeMatch[1], 10));
      const b = Math.min(maxWeek, parseInt(rangeMatch[2], 10));
      for (let w = a; w <= b; w++) {
        if (isOdd && w % 2 === 0) continue;
        if (isEven && w % 2 === 1) continue;
        result.add(w);
      }
    } else {
      const singleMatch = seg.match(/(\d+)/);
      if (singleMatch) {
        const w = parseInt(singleMatch[1], 10);
        if (w >= 1 && w <= maxWeek) result.add(w);
      }
    }
  }

  if (result.size === 0) {
    return Array.from({ length: 16 }, (_, i) => i + 1);
  }
  return Array.from(result).sort((a, b) => a - b);
}

export function getWeekDateLabel(settings: AppSettings, week: number): string {
  const mon = getDateForWeekDay(settings.semesterStartDate, week, 1);
  const sun = getDateForWeekDay(settings.semesterStartDate, week, 7);
  return `${mon.getMonth() + 1}/${mon.getDate()} - ${sun.getMonth() + 1}/${sun.getDate()}`;
}
