import React, { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSchedule } from '../context/ScheduleContext';
import {
  DAY_NAMES_SHORT,
  getDateForWeekDay,
  isSameDay,
} from '../utils/dateUtils';
import { Course } from '../types/schedule';
import { WeekPickerModal } from '../components/WeekPickerModal';
import { CourseDetailModal } from '../components/CourseDetailModal';
import { CourseFormModal } from '../components/CourseFormModal';

const ROW_HEIGHT = 62;
const TIME_COL_WIDTH = 44;

export const TimetableScreen: React.FC = () => {
  const {
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
  } = useSchedule();

  const insets = useSafeAreaInsets();
  const [weekPickerVisible, setWeekPickerVisible] = useState(false);
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [draftSlot, setDraftSlot] = useState<{ day: number; section: number }>({
    day: 1,
    section: 1,
  });

  const dayCount = settings.showWeekend ? 7 : 5;
  const days = useMemo(() => Array.from({ length: dayCount }, (_, i) => i + 1), [dayCount]);
  const today = useMemo(() => new Date(), []);

  const dayDates = useMemo(
    () => days.map((d) => getDateForWeekDay(settings.semesterStartDate, selectedWeek, d)),
    [days, settings.semesterStartDate, selectedWeek]
  );

  const visibleCourses = useMemo(() => {
    const inDayRange = courses.filter((c) => c.day <= dayCount);
    const active = inDayRange.filter((c) => c.weeks.includes(selectedWeek));
    if (!settings.showNonCurrentWeek) return active;

    // Include non-current-week courses only if they don't overlap an active course in the same slot
    const inactive = inDayRange.filter((c) => {
      if (c.weeks.includes(selectedWeek)) return false;
      const overlapsActive = active.some(
        (a) =>
          a.day === c.day &&
          a.startSection <= c.endSection &&
          a.endSection >= c.startSection
      );
      return !overlapsActive;
    });

    return [...inactive, ...active];
  }, [courses, dayCount, selectedWeek, settings.showNonCurrentWeek]);

  const handleEmptySlotPress = (day: number, section: number) => {
    setEditingCourse(null);
    setDraftSlot({ day, section });
    setFormVisible(true);
  };

  const handleSaveCourse = (data: Omit<Course, 'id'>, existingId?: string) => {
    if (existingId) {
      updateCourse({ ...data, id: existingId });
    } else {
      addCourse(data);
    }
  };

  const monthLabel = `${dayDates[0].getMonth() + 1}月`;

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => setSelectedWeek(Math.max(1, selectedWeek - 1))}
            style={[styles.circleBtn, { backgroundColor: theme.surfaceGlass, borderColor: theme.border }]}
            hitSlop={6}
          >
            <Ionicons name="chevron-back" size={16} color={theme.text} />
          </Pressable>

          <Pressable
            onPress={() => setWeekPickerVisible(true)}
            style={[
              styles.weekPill,
              { backgroundColor: theme.surfaceGlass, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.weekTitle, { color: theme.text }]}>
              第 {selectedWeek} 周
            </Text>
            <View
              style={[
                styles.weekBadge,
                {
                  backgroundColor:
                    selectedWeek === currentWeek ? theme.primarySoft : theme.borderSubtle,
                },
              ]}
            >
              <Text
                style={[
                  styles.weekBadgeText,
                  {
                    color:
                      selectedWeek === currentWeek ? theme.primary : theme.textSecondary,
                  },
                ]}
              >
                {selectedWeek === currentWeek ? '本周' : '非本周'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={14} color={theme.textSecondary} />
          </Pressable>

          <Pressable
            onPress={() => setSelectedWeek(Math.min(settings.totalWeeks, selectedWeek + 1))}
            style={[styles.circleBtn, { backgroundColor: theme.surfaceGlass, borderColor: theme.border }]}
            hitSlop={6}
          >
            <Ionicons name="chevron-forward" size={16} color={theme.text} />
          </Pressable>
        </View>

        <View style={styles.headerRight}>
          {selectedWeek !== currentWeek && (
            <Pressable
              onPress={() => setSelectedWeek(currentWeek)}
              style={[styles.backTodayPill, { backgroundColor: theme.primarySoft }]}
            >
              <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '700' }}>今</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => {
              setEditingCourse(null);
              setDraftSlot({ day: 1, section: 1 });
              setFormVisible(true);
            }}
            style={[styles.addBtn, { backgroundColor: theme.primary }]}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {/* Weekday Strip */}
      <View
        style={[
          styles.dayHeaderRow,
          {
            backgroundColor: theme.surfaceGlass,
            borderColor: theme.border,
          },
          Platform.OS === 'web' ? ({ backdropFilter: 'blur(12px)' } as any) : null,
        ]}
      >
        <View style={[styles.monthCell, { width: TIME_COL_WIDTH }]}>
          <Text style={[styles.monthText, { color: theme.textSecondary }]}>{monthLabel}</Text>
        </View>
        {days.map((d, idx) => {
          const dateObj = dayDates[idx];
          const isToday = isSameDay(dateObj, today);
          return (
            <View
              key={d}
              style={[
                styles.dayCell,
                isToday && {
                  backgroundColor: theme.primary,
                  borderRadius: 12,
                },
              ]}
            >
              <Text
                style={[
                  styles.dayName,
                  { color: isToday ? '#FFFFFF' : theme.text },
                ]}
              >
                {DAY_NAMES_SHORT[d - 1]}
              </Text>
              <Text
                style={[
                  styles.dayDate,
                  { color: isToday ? 'rgba(255,255,255,0.85)' : theme.textMuted },
                ]}
              >
                {dateObj.getDate()}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Main Scrollable Timetable Grid */}
      <ScrollView
        style={styles.gridScroll}
        contentContainerStyle={{ paddingBottom: 108 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gridWrapper}>
          {/* Left Time Column */}
          <View style={[styles.timeColumn, { width: TIME_COL_WIDTH }]}>
            {timeSlots.map((slot) => (
              <View
                key={slot.section}
                style={[
                  styles.timeCell,
                  { height: ROW_HEIGHT, borderBottomColor: theme.borderSubtle },
                ]}
              >
                <Text style={[styles.secNum, { color: theme.text }]}>{slot.section}</Text>
                <Text style={[styles.secTime, { color: theme.textMuted }]}>{slot.startTime}</Text>
                <Text style={[styles.secTime, { color: theme.textMuted }]}>{slot.endTime}</Text>
              </View>
            ))}
          </View>

          {/* Right Day Columns */}
          <View style={styles.columnsArea}>
            {/* Background Grid Cells (tappable to quick-add) */}
            {timeSlots.map((slot) => (
              <View key={slot.section} style={[styles.gridRow, { height: ROW_HEIGHT }]}>
                {days.map((d) => (
                  <Pressable
                    key={`${d}-${slot.section}`}
                    onPress={() => handleEmptySlotPress(d, slot.section)}
                    style={({ pressed }) => [
                      styles.emptyCell,
                      {
                        borderColor: theme.borderSubtle,
                        backgroundColor: pressed ? theme.primarySoft : 'transparent',
                      },
                    ]}
                  />
                ))}
              </View>
            ))}

            {/* Course Cards Overlay */}
            <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
              {visibleCourses.map((course) => {
                const isActive = course.weeks.includes(selectedWeek);
                const token = palette.colors[course.colorIndex % palette.colors.length];
                const span = Math.max(1, course.endSection - course.startSection + 1);
                const top = (course.startSection - 1) * ROW_HEIGHT + 2;
                const height = span * ROW_HEIGHT - 4;
                const colWidthPct = 100 / dayCount;
                const leftPct = (course.day - 1) * colWidthPct;

                return (
                  <Pressable
                    key={course.id}
                    onPress={() => setDetailCourse(course)}
                    style={({ pressed }) => [
                      styles.courseCardWrap,
                      {
                        top,
                        height,
                        left: `${leftPct}%`,
                        width: `${colWidthPct}%`,
                        transform: [{ scale: pressed ? 0.96 : 1 }],
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.courseCard,
                        {
                          backgroundColor: isActive
                            ? theme.isDark
                              ? token.bgDark
                              : token.bgLight
                            : theme.surfaceGlass,
                          borderColor: isActive
                            ? theme.isDark
                              ? token.borderDark
                              : token.borderLight
                            : theme.border,
                          borderStyle: isActive ? 'solid' : 'dashed',
                          opacity: isActive ? settings.cardOpacity : 0.52,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.courseAccentStrip,
                          { backgroundColor: isActive ? token.accent : theme.textMuted },
                        ]}
                      />
                      <View style={styles.courseCardInner}>
                        {!isActive && (
                          <Text style={[styles.nonWeekTag, { color: theme.textMuted }]}>
                            非本周
                          </Text>
                        )}
                        <Text
                          numberOfLines={span >= 2 ? 3 : 1}
                          style={[
                            styles.courseTitle,
                            {
                              color: isActive
                                ? theme.isDark
                                  ? token.textDark
                                  : token.textLight
                                : theme.textSecondary,
                            },
                          ]}
                        >
                          {course.name}
                        </Text>
                        {course.room ? (
                          <Text
                            numberOfLines={2}
                            style={[
                              styles.courseMeta,
                              {
                                color: isActive
                                  ? theme.isDark
                                    ? token.subTextDark
                                    : token.subTextLight
                                  : theme.textMuted,
                              },
                            ]}
                          >
                            @{course.room}
                          </Text>
                        ) : null}
                        {span >= 3 && course.teacher ? (
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.courseMeta,
                              {
                                color: isActive
                                  ? theme.isDark
                                    ? token.subTextDark
                                    : token.subTextLight
                                  : theme.textMuted,
                              },
                            ]}
                          >
                            {course.teacher}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>

      <WeekPickerModal
        visible={weekPickerVisible}
        onClose={() => setWeekPickerVisible(false)}
      />

      <CourseDetailModal
        course={detailCourse}
        onClose={() => setDetailCourse(null)}
        onEdit={(c) => {
          setEditingCourse(c);
          setFormVisible(true);
        }}
        onDelete={deleteCourse}
      />

      <CourseFormModal
        visible={formVisible}
        editingCourse={editingCourse}
        initialDay={draftSlot.day}
        initialSection={draftSlot.section}
        onClose={() => setFormVisible(false)}
        onSave={handleSaveCourse}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circleBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 14,
    borderWidth: 1,
  },
  weekTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  weekBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  weekBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  backTodayPill: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginBottom: 4,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  monthCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    marginHorizontal: 1,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '700',
  },
  dayDate: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  gridScroll: {
    flex: 1,
    paddingHorizontal: 8,
  },
  gridWrapper: {
    flexDirection: 'row',
  },
  timeColumn: {
    paddingRight: 2,
  },
  timeCell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  secNum: {
    fontSize: 12,
    fontWeight: '800',
  },
  secTime: {
    fontSize: 8.5,
    marginTop: 1,
  },
  columnsArea: {
    flex: 1,
    position: 'relative',
  },
  gridRow: {
    flexDirection: 'row',
  },
  emptyCell: {
    flex: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  courseCardWrap: {
    position: 'absolute',
    paddingHorizontal: 2,
  },
  courseCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  courseAccentStrip: {
    width: 3,
    height: '100%',
  },
  courseCardInner: {
    flex: 1,
    paddingHorizontal: 5,
    paddingVertical: 5,
    justifyContent: 'space-between',
  },
  nonWeekTag: {
    fontSize: 8.5,
    fontWeight: '700',
  },
  courseTitle: {
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
  },
  courseMeta: {
    fontSize: 9.5,
    fontWeight: '500',
    lineHeight: 12,
    marginTop: 2,
  },
});
