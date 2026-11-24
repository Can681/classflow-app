import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSchedule } from '../context/ScheduleContext';
import {
  DAY_NAMES_FULL,
  DAY_NAMES_SHORT,
  computeLiveStatus,
  formatCountdown,
  getCourseTimeRange,
  getIsoWeekday,
  timeToSeconds,
} from '../utils/dateUtils';
import { Course } from '../types/schedule';
import { CourseDetailModal } from '../components/CourseDetailModal';
import { CourseFormModal } from '../components/CourseFormModal';

export const TodayScreen: React.FC = () => {
  const {
    courses,
    timeSlots,
    settings,
    theme,
    palette,
    currentWeek,
    addCourse,
    updateCourse,
    deleteCourse,
  } = useSchedule();

  const insets = useSafeAreaInsets();
  const [now, setNow] = useState(() => new Date());
  const todayDay = getIsoWeekday(now);
  const [selectedDay, setSelectedDay] = useState<number>(todayDay);
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formVisible, setFormVisible] = useState(false);

  // Live 1-second ticker for countdown
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayCourses = useMemo(
    () =>
      courses
        .filter((c) => c.day === todayDay && c.weeks.includes(currentWeek))
        .sort((a, b) => a.startSection - b.startSection),
    [courses, todayDay, currentWeek]
  );

  const tomorrowDay = todayDay === 7 ? 1 : todayDay + 1;
  const tomorrowWeek = todayDay === 7 ? Math.min(settings.totalWeeks, currentWeek + 1) : currentWeek;

  const tomorrowCourses = useMemo(
    () =>
      courses
        .filter((c) => c.day === tomorrowDay && c.weeks.includes(tomorrowWeek))
        .sort((a, b) => a.startSection - b.startSection),
    [courses, tomorrowDay, tomorrowWeek]
  );

  const selectedDayCourses = useMemo(
    () =>
      courses
        .filter((c) => c.day === selectedDay && c.weeks.includes(currentWeek))
        .sort((a, b) => a.startSection - b.startSection),
    [courses, selectedDay, currentWeek]
  );

  const liveStatus = useMemo(
    () => computeLiveStatus(todayCourses, tomorrowCourses, timeSlots, now),
    [todayCourses, tomorrowCourses, timeSlots, now]
  );

  const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const dateHeader = `${now.getMonth() + 1}月${now.getDate()}日 · ${DAY_NAMES_FULL[todayDay - 1]} · 第 ${currentWeek} 周`;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, 14),
        paddingHorizontal: 16,
        paddingBottom: 112,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Greeting */}
      <View style={styles.topRow}>
        <View>
          <Text style={[styles.dateSub, { color: theme.textSecondary }]}>{dateHeader}</Text>
          <Text style={[styles.pageTitle, { color: theme.text }]}>今日日程</Text>
        </View>
        <View style={[styles.countPill, { backgroundColor: theme.surfaceGlass, borderColor: theme.border }]}>
          <Text style={{ color: theme.primary, fontWeight: '800', fontSize: 13 }}>
            今日 {todayCourses.length} 节
          </Text>
        </View>
      </View>

      {/* Hero Live Countdown Card */}
      <LinearGradient
        colors={
          liveStatus.mode === 'in_class'
            ? ['#3B5BFF', '#6C63FF']
            : liveStatus.mode === 'upcoming'
            ? ['#4F6EF7', '#38BDF8']
            : ['#334155', '#475569']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroTopRow}>
          <View style={styles.liveTag}>
            <View
              style={[
                styles.liveDot,
                {
                  backgroundColor:
                    liveStatus.mode === 'in_class'
                      ? '#4ADE80'
                      : liveStatus.mode === 'upcoming'
                      ? '#FDE047'
                      : '#CBD5E1',
                },
              ]}
            />
            <Text style={styles.liveTagText}>
              {liveStatus.mode === 'in_class'
                ? '正在上课'
                : liveStatus.mode === 'upcoming'
                ? '即将上课'
                : liveStatus.mode === 'done'
                ? '今日已结束'
                : '今日无课'}
            </Text>
          </View>
          <Text style={styles.clockText}>
            {String(now.getHours()).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')}
          </Text>
        </View>

        {liveStatus.mode === 'in_class' && liveStatus.course ? (
          <>
            <Text style={styles.heroCourseName}>{liveStatus.course.name}</Text>
            <Text style={styles.heroSub}>
              {liveStatus.course.room} · {liveStatus.course.teacher} · {liveStatus.timeRange?.start}-
              {liveStatus.timeRange?.end}
            </Text>
            <View style={styles.countdownRow}>
              <Text style={styles.countdownLabel}>距离下课还有</Text>
              <Text style={styles.countdownValue}>
                {formatCountdown(liveStatus.remainingSeconds)}
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.round(liveStatus.progress * 100)}%` },
                ]}
              />
            </View>
          </>
        ) : liveStatus.mode === 'upcoming' && liveStatus.course ? (
          <>
            <Text style={styles.heroCourseName}>{liveStatus.course.name}</Text>
            <Text style={styles.heroSub}>
              {liveStatus.course.room} · 第 {liveStatus.course.startSection}-
              {liveStatus.course.endSection} 节 ({liveStatus.timeRange?.start})
            </Text>
            <View style={styles.countdownRow}>
              <Text style={styles.countdownLabel}>距离上课倒计时</Text>
              <Text style={styles.countdownValue}>
                {formatCountdown(liveStatus.remainingSeconds)}
              </Text>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.heroCourseName}>
              {liveStatus.mode === 'done' ? '今天的课程都上完啦 ✨' : '今天没有安排课程 🌿'}
            </Text>
            <Text style={styles.heroSub}>
              {liveStatus.nextCourse
                ? `明天第一节：${liveStatus.nextCourse.name} (${
                    getCourseTimeRange(liveStatus.nextCourse, timeSlots).start
                  } · ${liveStatus.nextCourse.room})`
                : '明天也暂无课程安排，好好休息吧！'}
            </Text>
          </>
        )}
      </LinearGradient>

      {/* Weekday Selector Strip */}
      <View
        style={[
          styles.dayStrip,
          { backgroundColor: theme.surfaceGlass, borderColor: theme.border },
        ]}
      >
        {DAY_NAMES_SHORT.map((label, idx) => {
          const d = idx + 1;
          const isSelected = d === selectedDay;
          const isToday = d === todayDay;
          const count = courses.filter((c) => c.day === d && c.weeks.includes(currentWeek)).length;
          return (
            <Pressable
              key={d}
              onPress={() => setSelectedDay(d)}
              style={[
                styles.dayChip,
                isSelected && { backgroundColor: theme.primary },
              ]}
            >
              <Text
                style={[
                  styles.dayChipText,
                  { color: isSelected ? '#FFF' : isToday ? theme.primary : theme.text },
                ]}
              >
                {label}
              </Text>
              <View
                style={[
                  styles.dotIndicator,
                  {
                    backgroundColor:
                      count > 0
                        ? isSelected
                          ? '#FFFFFF'
                          : theme.primary
                        : 'transparent',
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </View>

      {/* Vertical Timeline */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {selectedDay === todayDay ? '今日课程时间轴' : `${DAY_NAMES_FULL[selectedDay - 1]}课程安排`}
        </Text>
        <Text style={{ color: theme.textMuted, fontSize: 12 }}>
          共 {selectedDayCourses.length} 门课程
        </Text>
      </View>

      {selectedDayCourses.length === 0 ? (
        <View
          style={[
            styles.emptyBox,
            { backgroundColor: theme.surfaceGlass, borderColor: theme.border },
          ]}
        >
          <Ionicons name="cafe-outline" size={34} color={theme.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>这一天没有课</Text>
          <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>
            享受自由支配的时光，或前往课表页点击空白格添加课程
          </Text>
        </View>
      ) : (
        selectedDayCourses.map((course) => {
          const token = palette.colors[course.colorIndex % palette.colors.length];
          const range = getCourseTimeRange(course, timeSlots);
          const startSec = timeToSeconds(range.start);
          const endSec = timeToSeconds(range.end);

          let statusLabel = '';
          let statusColor = theme.textMuted;
          if (selectedDay === todayDay) {
            if (nowSeconds > endSec) {
              statusLabel = '已结束';
              statusColor = theme.textMuted;
            } else if (nowSeconds >= startSec) {
              statusLabel = '进行中';
              statusColor = theme.success;
            } else {
              statusLabel = '待上课';
              statusColor = theme.primary;
            }
          }

          return (
            <Pressable
              key={course.id}
              onPress={() => setDetailCourse(course)}
              style={({ pressed }) => [
                styles.timelineCard,
                {
                  backgroundColor: theme.surfaceGlass,
                  borderColor: theme.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <View style={styles.timeCol}>
                <Text style={[styles.timeStart, { color: theme.text }]}>{range.start}</Text>
                <Text style={[styles.timeEnd, { color: theme.textMuted }]}>{range.end}</Text>
                <View style={[styles.secBadge, { backgroundColor: `${token.accent}20` }]}>
                  <Text style={{ color: token.accent, fontSize: 10, fontWeight: '700' }}>
                    {course.startSection}-{course.endSection}节
                  </Text>
                </View>
              </View>

              <View style={[styles.vBar, { backgroundColor: token.accent }]} />

              <View style={styles.cardBody}>
                <View style={styles.cardTitleRow}>
                  <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
                    {course.name}
                  </Text>
                  {statusLabel ? (
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: `${statusColor}1A` },
                      ]}
                    >
                      <Text style={{ color: statusColor, fontSize: 10, fontWeight: '700' }}>
                        {statusLabel}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={13} color={theme.textSecondary} />
                  <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                    {course.room || '待定教室'}
                  </Text>
                  <Ionicons
                    name="person-outline"
                    size={13}
                    color={theme.textSecondary}
                    style={{ marginLeft: 8 }}
                  />
                  <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                    {course.teacher || '未知教师'}
                  </Text>
                </View>

                {course.note ? (
                  <Text style={[styles.noteText, { color: theme.textMuted }]} numberOfLines={1}>
                    备注：{course.note}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })
      )}

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
        onClose={() => setFormVisible(false)}
        onSave={(data, id) => {
          if (id) updateCourse({ ...data, id });
          else addCourse(data);
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  dateSub: {
    fontSize: 12,
    fontWeight: '600',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  countPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#3B5BFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 8,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  liveTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  clockText: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 14,
    fontWeight: '700',
  },
  heroCourseName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 13,
    marginTop: 5,
    lineHeight: 19,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  countdownLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  countdownValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  dayStrip: {
    flexDirection: 'row',
    borderRadius: 18,
    borderWidth: 1,
    padding: 5,
    marginBottom: 18,
  },
  dayChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 13,
    gap: 4,
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dotIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  emptyBox: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  timelineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  timeCol: {
    width: 54,
    alignItems: 'center',
  },
  timeStart: {
    fontSize: 14,
    fontWeight: '800',
  },
  timeEnd: {
    fontSize: 11,
    marginTop: 2,
  },
  secBadge: {
    marginTop: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  vBar: {
    width: 4,
    height: '86%',
    minHeight: 44,
    borderRadius: 4,
  },
  cardBody: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  noteText: {
    fontSize: 11,
    marginTop: 5,
  },
});
