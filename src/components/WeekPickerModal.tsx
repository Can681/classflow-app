import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSchedule } from '../context/ScheduleContext';
import { getWeekDateLabel } from '../utils/dateUtils';

interface WeekPickerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const WeekPickerModal: React.FC<WeekPickerModalProps> = ({ visible, onClose }) => {
  const { settings, currentWeek, selectedWeek, setSelectedWeek, theme } = useSchedule();
  const weeks = Array.from({ length: settings.totalWeeks }, (_, i) => i + 1);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: theme.text }]}>切换周次</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                {settings.semesterName} · 当前第 {currentWeek} 周
              </Text>
            </View>
            {selectedWeek !== currentWeek && (
              <Pressable
                onPress={() => {
                  setSelectedWeek(currentWeek);
                  onClose();
                }}
                style={[styles.todayBtn, { backgroundColor: theme.primarySoft }]}
              >
                <Ionicons name="locate" size={14} color={theme.primary} />
                <Text style={[styles.todayBtnText, { color: theme.primary }]}>回到本周</Text>
              </Pressable>
            )}
          </View>

          <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
            {weeks.map((w) => {
              const isSelected = w === selectedWeek;
              const isNow = w === currentWeek;
              return (
                <Pressable
                  key={w}
                  onPress={() => {
                    setSelectedWeek(w);
                    onClose();
                  }}
                  style={[
                    styles.cell,
                    {
                      backgroundColor: isSelected
                        ? theme.primary
                        : isNow
                        ? theme.primarySoft
                        : theme.bg,
                      borderColor: isSelected
                        ? theme.primary
                        : isNow
                        ? theme.primary
                        : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.weekNum,
                      { color: isSelected ? '#FFFFFF' : isNow ? theme.primary : theme.text },
                    ]}
                  >
                    第 {w} 周
                  </Text>
                  <Text
                    style={[
                      styles.dateRange,
                      {
                        color: isSelected
                          ? 'rgba(255,255,255,0.82)'
                          : isNow
                          ? theme.primary
                          : theme.textMuted,
                      },
                    ]}
                  >
                    {isNow ? '本周' : getWeekDateLabel(settings, w)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
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
  sheet: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '72%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  todayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  todayBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cell: {
    width: '31%',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  weekNum: {
    fontSize: 14,
    fontWeight: '700',
  },
  dateRange: {
    fontSize: 10,
    marginTop: 3,
  },
});
