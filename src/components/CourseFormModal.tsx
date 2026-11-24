import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Course, WeekType } from '../types/schedule';
import { useSchedule } from '../context/ScheduleContext';
import { DAY_NAMES_SHORT } from '../utils/dateUtils';

interface CourseFormModalProps {
  visible: boolean;
  editingCourse: Course | null;
  initialDay?: number;
  initialSection?: number;
  onClose: () => void;
  onSave: (course: Omit<Course, 'id'>, existingId?: string) => void;
}

export const CourseFormModal: React.FC<CourseFormModalProps> = ({
  visible,
  editingCourse,
  initialDay = 1,
  initialSection = 1,
  onClose,
  onSave,
}) => {
  const { theme, palette, settings } = useSchedule();

  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [teacher, setTeacher] = useState('');
  const [credits, setCredits] = useState('');
  const [note, setNote] = useState('');
  const [day, setDay] = useState(1);
  const [startSection, setStartSection] = useState(1);
  const [endSection, setEndSection] = useState(2);
  const [weeks, setWeeks] = useState<number[]>(Array.from({ length: 16 }, (_, i) => i + 1));
  const [weekType, setWeekType] = useState<WeekType>('all');
  const [colorIndex, setColorIndex] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setError('');
    if (editingCourse) {
      setName(editingCourse.name);
      setRoom(editingCourse.room);
      setTeacher(editingCourse.teacher);
      setCredits(editingCourse.credits || '');
      setNote(editingCourse.note || '');
      setDay(editingCourse.day);
      setStartSection(editingCourse.startSection);
      setEndSection(editingCourse.endSection);
      setWeeks(editingCourse.weeks);
      setWeekType(editingCourse.weekType);
      setColorIndex(editingCourse.colorIndex);
    } else {
      setName('');
      setRoom('');
      setTeacher('');
      setCredits('');
      setNote('');
      setDay(initialDay);
      setStartSection(initialSection);
      setEndSection(Math.min(12, initialSection + 1));
      setWeeks(Array.from({ length: Math.min(16, settings.totalWeeks) }, (_, i) => i + 1));
      setWeekType('all');
      setColorIndex(Math.floor(Math.random() * 12));
    }
  }, [visible, editingCourse, initialDay, initialSection, settings.totalWeeks]);

  const applyWeekPreset = (mode: 'all' | 'odd' | 'even') => {
    setWeekType(mode);
    const maxW = Math.min(16, settings.totalWeeks);
    const arr: number[] = [];
    for (let w = 1; w <= maxW; w++) {
      if (mode === 'odd' && w % 2 === 0) continue;
      if (mode === 'even' && w % 2 === 1) continue;
      arr.push(w);
    }
    setWeeks(arr);
  };

  const toggleWeek = (w: number) => {
    setWeekType('custom');
    setWeeks((prev) =>
      prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w].sort((a, b) => a - b)
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError('请输入课程名称');
      return;
    }
    if (weeks.length === 0) {
      setError('请至少选择一个上课周次');
      return;
    }
    const safeStart = Math.min(startSection, endSection);
    const safeEnd = Math.max(startSection, endSection);
    onSave(
      {
        name: name.trim(),
        room: room.trim() || '待定教室',
        teacher: teacher.trim() || '未填写',
        credits: credits.trim() || undefined,
        note: note.trim() || undefined,
        day,
        startSection: safeStart,
        endSection: safeEnd,
        weeks,
        weekType,
        colorIndex,
      },
      editingCourse?.id
    );
    onClose();
  };

  const allWeeks = Array.from({ length: settings.totalWeeks }, (_, i) => i + 1);
  const sections = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={[styles.header, { borderBottomColor: theme.borderSubtle }]}>
            <Text style={[styles.title, { color: theme.text }]}>
              {editingCourse ? '编辑课程' : '添加新课程'}
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={theme.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {error ? (
              <View style={[styles.errorBox, { backgroundColor: theme.dangerSoft }]}>
                <Text style={{ color: theme.danger, fontSize: 13, fontWeight: '600' }}>
                  {error}
                </Text>
              </View>
            ) : null}

            <Text style={[styles.label, { color: theme.textSecondary }]}>课程名称 *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="例如：高等数学 (上)"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.input,
                { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border },
              ]}
            />

            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>上课教室</Text>
                <TextInput
                  value={room}
                  onChangeText={setRoom}
                  placeholder="例如：博学楼 A201"
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.input,
                    { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border },
                  ]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>任课教师</Text>
                <TextInput
                  value={teacher}
                  onChangeText={setTeacher}
                  placeholder="例如：周教授"
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.input,
                    { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border },
                  ]}
                />
              </View>
            </View>

            <Text style={[styles.label, { color: theme.textSecondary }]}>星期</Text>
            <View style={styles.chipRow}>
              {DAY_NAMES_SHORT.map((dLabel, idx) => {
                const dNum = idx + 1;
                const active = day === dNum;
                return (
                  <Pressable
                    key={dNum}
                    onPress={() => setDay(dNum)}
                    style={[
                      styles.dayChip,
                      {
                        backgroundColor: active ? theme.primary : theme.bg,
                        borderColor: active ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: active ? '#FFF' : theme.text,
                        fontWeight: '700',
                        fontSize: 13,
                      }}
                    >
                      {dLabel}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>
                  开始节次 (第 {startSection} 节)
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.secStrip}>
                  {sections.map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => {
                        setStartSection(s);
                        if (endSection < s) setEndSection(s);
                      }}
                      style={[
                        styles.secChip,
                        {
                          backgroundColor: startSection === s ? theme.primary : theme.bg,
                          borderColor: startSection === s ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: startSection === s ? '#FFF' : theme.text,
                          fontSize: 12,
                          fontWeight: '700',
                        }}
                      >
                        {s}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>
                  结束节次 (第 {endSection} 节)
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.secStrip}>
                  {sections.map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => {
                        setEndSection(s);
                        if (startSection > s) setStartSection(s);
                      }}
                      style={[
                        styles.secChip,
                        {
                          backgroundColor: endSection === s ? theme.primary : theme.bg,
                          borderColor: endSection === s ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: endSection === s ? '#FFF' : theme.text,
                          fontSize: 12,
                          fontWeight: '700',
                        }}
                      >
                        {s}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.weekHeader}>
              <Text style={[styles.label, { color: theme.textSecondary, marginTop: 0 }]}>
                上课周次 ({weeks.length} 周)
              </Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {(
                  [
                    { key: 'all', label: '全周' },
                    { key: 'odd', label: '单周' },
                    { key: 'even', label: '双周' },
                  ] as const
                ).map((m) => (
                  <Pressable
                    key={m.key}
                    onPress={() => applyWeekPreset(m.key)}
                    style={[
                      styles.presetBtn,
                      {
                        backgroundColor: weekType === m.key ? theme.primarySoft : theme.bg,
                        borderColor: weekType === m.key ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: weekType === m.key ? theme.primary : theme.textSecondary,
                        fontSize: 11,
                        fontWeight: '700',
                      }}
                    >
                      {m.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.weekGrid}>
              {allWeeks.map((w) => {
                const selected = weeks.includes(w);
                return (
                  <Pressable
                    key={w}
                    onPress={() => toggleWeek(w)}
                    style={[
                      styles.weekCell,
                      {
                        backgroundColor: selected ? theme.primary : theme.bg,
                        borderColor: selected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: selected ? '#FFF' : theme.textSecondary,
                        fontSize: 12,
                        fontWeight: '700',
                      }}
                    >
                      {w}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.label, { color: theme.textSecondary }]}>卡片配色</Text>
            <View style={styles.swatchRow}>
              {palette.colors.map((c, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => setColorIndex(idx)}
                  style={[
                    styles.swatch,
                    {
                      backgroundColor: c.accent,
                      borderWidth: colorIndex === idx ? 3 : 0,
                      borderColor: theme.text,
                    },
                  ]}
                >
                  {colorIndex === idx && <Ionicons name="checkmark" size={14} color="#FFF" />}
                </Pressable>
              ))}
            </View>

            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>学分 (选填)</Text>
                <TextInput
                  value={credits}
                  onChangeText={setCredits}
                  placeholder="3.0"
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.input,
                    { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border },
                  ]}
                />
              </View>
              <View style={{ flex: 2 }}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>备注 (选填)</Text>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="例如：带实验报告"
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.input,
                    { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border },
                  ]}
                />
              </View>
            </View>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: theme.borderSubtle }]}>
            <Pressable
              onPress={onClose}
              style={[styles.cancelBtn, { backgroundColor: theme.bg }]}
            >
              <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>取消</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              style={[styles.saveBtn, { backgroundColor: theme.primary }]}
            >
              <Ionicons name="checkmark-circle" size={18} color="#FFF" />
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>保存课程</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  scroll: {
    maxHeight: 540,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 28,
  },
  errorBox: {
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
  },
  row2: {
    flexDirection: 'row',
    gap: 10,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dayChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  secStrip: {
    flexDirection: 'row',
  },
  secChip: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 8,
  },
  presetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  weekGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  weekCell: {
    width: '12.5%',
    aspectRatio: 1.15,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: 28,
    borderTopWidth: 1,
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
