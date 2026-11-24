import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Course } from '../types/schedule';
import { useSchedule } from '../context/ScheduleContext';
import { DAY_NAMES_FULL, formatWeeksText, getCourseTimeRange } from '../utils/dateUtils';

interface CourseDetailModalProps {
  course: Course | null;
  onClose: () => void;
  onEdit: (course: Course) => void;
  onDelete: (id: string) => void;
}

export const CourseDetailModal: React.FC<CourseDetailModalProps> = ({
  course,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { theme, palette, timeSlots, selectedWeek } = useSchedule();
  if (!course) return null;

  const token = palette.colors[course.colorIndex % palette.colors.length];
  const range = getCourseTimeRange(course, timeSlots);
  const isActiveThisWeek = course.weeks.includes(selectedWeek);

  const InfoRow: React.FC<{ icon: keyof typeof Ionicons.glyphMap; label: string; value: string }> = ({
    icon,
    label,
    value,
  }) => (
    <View style={[styles.infoRow, { borderBottomColor: theme.borderSubtle }]}>
      <View style={[styles.iconCircle, { backgroundColor: `${token.accent}18` }]}>
        <Ionicons name={icon} size={16} color={token.accent} />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={[styles.infoLabel, { color: theme.textMuted }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
      </View>
    </View>
  );

  return (
    <Modal visible={!!course} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Accent header */}
          <View
            style={[
              styles.hero,
              { backgroundColor: theme.isDark ? token.bgDark : token.bgLight },
            ]}
          >
            <View style={[styles.accentBar, { backgroundColor: token.accent }]} />
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <View style={[styles.pill, { backgroundColor: `${token.accent}24` }]}>
                  <Text style={[styles.pillText, { color: token.accent }]}>
                    {isActiveThisWeek ? `第 ${selectedWeek} 周有课` : `第 ${selectedWeek} 周无课`}
                  </Text>
                </View>
                {course.credits ? (
                  <View style={[styles.pill, { backgroundColor: `${token.accent}18` }]}>
                    <Text style={[styles.pillText, { color: token.accent }]}>
                      {course.credits} 学分
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text
                style={[
                  styles.courseName,
                  { color: theme.isDark ? token.textDark : token.textLight },
                ]}
              >
                {course.name}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <Ionicons
                name="close"
                size={20}
                color={theme.isDark ? token.subTextDark : token.subTextLight}
              />
            </Pressable>
          </View>

          <View style={styles.body}>
            <InfoRow
              icon="time-outline"
              label="上课时间"
              value={`${DAY_NAMES_FULL[course.day - 1]} · 第 ${course.startSection}-${course.endSection} 节 (${range.start} - ${range.end})`}
            />
            <InfoRow
              icon="location-outline"
              label="上课教室"
              value={course.room || '未填写教室'}
            />
            <InfoRow
              icon="person-outline"
              label="任课教师"
              value={course.teacher || '未填写教师'}
            />
            <InfoRow
              icon="calendar-outline"
              label="上课周次"
              value={formatWeeksText(course.weeks)}
            />
            {course.note ? (
              <InfoRow icon="document-text-outline" label="课程备注" value={course.note} />
            ) : null}
          </View>

          <View style={styles.footer}>
            <Pressable
              onPress={() => {
                onDelete(course.id);
                onClose();
              }}
              style={[styles.actionBtn, { backgroundColor: theme.dangerSoft }]}
            >
              <Ionicons name="trash-outline" size={16} color={theme.danger} />
              <Text style={[styles.actionText, { color: theme.danger }]}>删除</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onClose();
                onEdit(course);
              }}
              style={[styles.actionBtn, styles.editBtn, { backgroundColor: theme.primary }]}
            >
              <Ionicons name="create-outline" size={16} color="#FFFFFF" />
              <Text style={[styles.actionText, { color: '#FFFFFF' }]}>编辑课程</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 520,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    gap: 12,
  },
  accentBar: {
    width: 4,
    height: 48,
    borderRadius: 4,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  courseName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingBottom: 30,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 16,
  },
  editBtn: {
    flex: 1,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
