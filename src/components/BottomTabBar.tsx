import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabKey } from '../types/schedule';
import { useSchedule } from '../context/ScheduleContext';

interface BottomTabBarProps {
  activeTab: TabKey;
  onSelect: (tab: TabKey) => void;
}

const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap; iconOutline: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'timetable', label: '课表', icon: 'grid', iconOutline: 'grid-outline' },
  { key: 'today', label: '今日', icon: 'time', iconOutline: 'time-outline' },
  { key: 'import', label: '教务导入', icon: 'cloud-download', iconOutline: 'cloud-download-outline' },
  { key: 'settings', label: '外观设置', icon: 'color-palette', iconOutline: 'color-palette-outline' },
];

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab, onSelect }) => {
  const { theme } = useSchedule();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.bar,
          {
            backgroundColor: theme.tabBarBg,
            borderColor: theme.border,
            shadowColor: theme.shadowColor,
          },
          Platform.OS === 'web'
            ? ({ backdropFilter: 'blur(18px)' } as any)
            : null,
        ]}
      >
        {TABS.map((t) => {
          const isActive = activeTab === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => onSelect(t.key)}
              style={({ pressed }) => [
                styles.tabBtn,
                isActive && { backgroundColor: theme.primarySoft },
                pressed && { opacity: 0.75 },
              ]}
            >
              <Ionicons
                name={isActive ? t.icon : t.iconOutline}
                size={20}
                color={isActive ? theme.primary : theme.textMuted}
              />
              <Text
                style={[
                  styles.label,
                  {
                    color: isActive ? theme.primary : theme.textMuted,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 6,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 480,
    borderRadius: 24,
    borderWidth: 1,
    padding: 6,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 18,
    gap: 2,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
});
