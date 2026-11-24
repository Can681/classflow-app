import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, Course, TimeSlot } from '../types/schedule';
import { DEFAULT_SETTINGS, SAMPLE_COURSES, STANDARD_TIME_SLOTS } from '../constants/defaults';
import { COLOR_PALETTES, DARK_THEME, LIGHT_THEME, UITheme, ColorPalette } from '../constants/themes';
import { getCurrentWeek } from '../utils/dateUtils';

const STORAGE_KEY = '@classflow_schedule_v1';

interface ScheduleContextValue {
  courses: Course[];
  timeSlots: TimeSlot[];
  settings: AppSettings;
  theme: UITheme;
  palette: ColorPalette;
  currentWeek: number;
  selectedWeek: number;
  setSelectedWeek: (week: number) => void;
  addCourse: (course: Omit<Course, 'id'>) => void;
  updateCourse: (course: Course) => void;
  deleteCourse: (id: string) => void;
  importCourses: (incoming: Course[], mode: 'merge' | 'replace', newTimeSlots?: TimeSlot[]) => void;
  updateSettings: (partial: Partial<AppSettings>) => void;
  updateTimeSlots: (slots: TimeSlot[]) => void;
  resetToSample: () => void;
  clearAllCourses: () => void;
  hydrated: boolean;
}

const ScheduleContext = createContext<ScheduleContextValue | null>(null);

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [courses, setCourses] = useState<Course[]>(SAMPLE_COURSES);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(STANDARD_TIME_SLOTS);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  const currentWeek = useMemo(
    () => getCurrentWeek(settings.semesterStartDate, settings.totalWeeks),
    [settings.semesterStartDate, settings.totalWeeks]
  );

  const [selectedWeek, setSelectedWeek] = useState<number>(currentWeek);

  // Hydrate from AsyncStorage
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && active) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.courses)) setCourses(parsed.courses);
          if (Array.isArray(parsed.timeSlots) && parsed.timeSlots.length > 0) {
            setTimeSlots(parsed.timeSlots);
          }
          if (parsed.settings) {
            const merged = { ...DEFAULT_SETTINGS, ...parsed.settings };
            setSettings(merged);
            setSelectedWeek(getCurrentWeek(merged.semesterStartDate, merged.totalWeeks));
          }
        }
      } catch {
        // Ignore storage parse error and fall back to defaults
      } finally {
        if (active) setHydrated(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Persist on changes
  useEffect(() => {
    if (!hydrated) return;
    const payload = JSON.stringify({ courses, timeSlots, settings });
    AsyncStorage.setItem(STORAGE_KEY, payload).catch(() => {});
  }, [courses, timeSlots, settings, hydrated]);

  const isDark =
    settings.themeMode === 'dark' ||
    (settings.themeMode === 'system' && systemScheme === 'dark');

  const theme = isDark ? DARK_THEME : LIGHT_THEME;
  const palette = COLOR_PALETTES[settings.paletteId] || COLOR_PALETTES.morandi;

  const addCourse = (c: Omit<Course, 'id'>) => {
    const newCourse: Course = {
      ...c,
      id: `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setCourses((prev) => [...prev, newCourse]);
  };

  const updateCourse = (updated: Course) => {
    setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const deleteCourse = (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  const importCourses = (
    incoming: Course[],
    mode: 'merge' | 'replace',
    newTimeSlots?: TimeSlot[]
  ) => {
    if (mode === 'replace') {
      setCourses(incoming);
    } else {
      setCourses((prev) => [...prev, ...incoming]);
    }
    if (newTimeSlots && newTimeSlots.length >= 4) {
      setTimeSlots(newTimeSlots);
    }
  };

  const updateSettings = (partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      if (partial.semesterStartDate || partial.totalWeeks) {
        setSelectedWeek(getCurrentWeek(next.semesterStartDate, next.totalWeeks));
      }
      return next;
    });
  };

  const updateTimeSlots = (slots: TimeSlot[]) => {
    setTimeSlots(slots);
  };

  const resetToSample = () => {
    setCourses(SAMPLE_COURSES);
    setTimeSlots(STANDARD_TIME_SLOTS);
    setSettings(DEFAULT_SETTINGS);
    setSelectedWeek(getCurrentWeek(DEFAULT_SETTINGS.semesterStartDate, DEFAULT_SETTINGS.totalWeeks));
  };

  const clearAllCourses = () => {
    setCourses([]);
  };

  return (
    <ScheduleContext.Provider
      value={{
        courses,
        timeSlots,
        settings,
        theme,
        palette,
        currentWeek,
        selectedWeek,
        setSelectedWeek,
        addCourse,
        updateCourse,
        deleteCourse,
        importCourses,
        updateSettings,
        updateTimeSlots,
        resetToSample,
        clearAllCourses,
        hydrated,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
};

export function useSchedule() {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error('useSchedule must be used within ScheduleProvider');
  return ctx;
}
