export type WeekType = 'all' | 'odd' | 'even' | 'custom';

export interface Course {
  id: string;
  name: string;
  teacher: string;
  room: string;
  /** 1 = Monday ... 7 = Sunday */
  day: number;
  /** 1-based inclusive section index */
  startSection: number;
  /** 1-based inclusive section index */
  endSection: number;
  /** Explicit list of active week numbers, e.g. [1,2,3,...,16] */
  weeks: number[];
  weekType: WeekType;
  /** Palette color slot 0..11 */
  colorIndex: number;
  note?: string;
  credits?: string;
}

export interface TimeSlot {
  section: number;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
}

export type PaletteId = 'morandi' | 'macaron' | 'aurora' | 'ink';

export type WallpaperId = 'none' | 'mist' | 'sakura' | 'forest' | 'midnight' | 'custom';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppSettings {
  semesterName: string;
  /** YYYY-MM-DD (Monday of Week 1) */
  semesterStartDate: string;
  totalWeeks: number;
  showWeekend: boolean;
  showNonCurrentWeek: boolean;
  themeMode: ThemeMode;
  paletteId: PaletteId;
  wallpaperId: WallpaperId;
  customWallpaperUri: string | null;
  /** 0.68 to 1.0 */
  cardOpacity: number;
}

export interface ScheduleBundle {
  version: number;
  exportedAt: string;
  courses: Course[];
  timeSlots: TimeSlot[];
  settings: Partial<AppSettings>;
}

export type TabKey = 'timetable' | 'today' | 'import' | 'settings';
