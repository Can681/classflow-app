import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useSchedule } from '../context/ScheduleContext';
import { COLOR_PALETTES, WALLPAPER_PRESETS } from '../constants/themes';
import { COMPACT_TIME_SLOTS, STANDARD_TIME_SLOTS } from '../constants/defaults';
import { PaletteId, ThemeMode } from '../types/schedule';

export const SettingsScreen: React.FC = () => {
  const { settings, timeSlots, theme, updateSettings, updateTimeSlots } = useSchedule();
  const insets = useSafeAreaInsets();
  const [showTimeEditor, setShowTimeEditor] = useState(false);

  const pickWallpaper = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      updateSettings({
        wallpaperId: 'custom',
        customWallpaperUri: res.assets[0].uri,
      });
    }
  };

  const handleSlotChange = (section: number, field: 'startTime' | 'endTime', value: string) => {
    const next = timeSlots.map((slot) =>
      slot.section === section ? { ...slot, [field]: value } : slot
    );
    updateTimeSlots(next);
  };

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
      <Text style={[styles.pageSub, { color: theme.textSecondary }]}>
        拾光课表 · 个性化美学定制
      </Text>
      <Text style={[styles.pageTitle, { color: theme.text }]}>外观与学期设置</Text>

      {/* Theme Mode */}
      <View style={[styles.card, { backgroundColor: theme.surfaceGlass, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>显示模式</Text>
        <View style={[styles.segRow, { backgroundColor: theme.bg, borderColor: theme.border }]}>
          {(
            [
              { key: 'light', label: '浅色', icon: 'sunny-outline' },
              { key: 'dark', label: '深色', icon: 'moon-outline' },
              { key: 'system', label: '跟随系统', icon: 'phone-portrait-outline' },
            ] as { key: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[]
          ).map((m) => {
            const active = settings.themeMode === m.key;
            return (
              <Pressable
                key={m.key}
                onPress={() => updateSettings({ themeMode: m.key })}
                style={[styles.segBtn, active && { backgroundColor: theme.primary }]}
              >
                <Ionicons
                  name={m.icon}
                  size={14}
                  color={active ? '#FFF' : theme.textSecondary}
                />
                <Text
                  style={{
                    color: active ? '#FFF' : theme.textSecondary,
                    fontSize: 12,
                    fontWeight: '700',
                  }}
                >
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Color Palettes */}
      <View style={[styles.card, { backgroundColor: theme.surfaceGlass, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>课程色板主题</Text>
        <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
          同名课程自动保持统一色系，浅深色模式智能适配对比度
        </Text>
        <View style={styles.paletteGrid}>
          {(Object.keys(COLOR_PALETTES) as PaletteId[]).map((pid) => {
            const pal = COLOR_PALETTES[pid];
            const active = settings.paletteId === pid;
            return (
              <Pressable
                key={pid}
                onPress={() => updateSettings({ paletteId: pid })}
                style={[
                  styles.paletteCard,
                  {
                    backgroundColor: theme.bg,
                    borderColor: active ? theme.primary : theme.border,
                    borderWidth: active ? 2 : 1,
                  },
                ]}
              >
                <View style={styles.paletteHeader}>
                  <Text style={[styles.paletteName, { color: theme.text }]}>{pal.name}</Text>
                  {active && <Ionicons name="checkmark-circle" size={16} color={theme.primary} />}
                </View>
                <Text style={{ color: theme.textMuted, fontSize: 10, marginBottom: 8 }}>
                  {pal.subtitle}
                </Text>
                <View style={styles.dotsRow}>
                  {pal.colors.slice(0, 6).map((c, i) => (
                    <View key={i} style={[styles.colorDot, { backgroundColor: c.accent }]} />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Wallpaper & Card Opacity */}
      <View style={[styles.card, { backgroundColor: theme.surfaceGlass, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>背景壁纸与通透度</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.wallpaperRow}
        >
          {WALLPAPER_PRESETS.map((wp) => {
            const active = settings.wallpaperId === wp.id;
            return (
              <Pressable
                key={wp.id}
                onPress={() => updateSettings({ wallpaperId: wp.id })}
                style={styles.wpItem}
              >
                <LinearGradient
                  colors={wp.preview}
                  style={[
                    styles.wpPreview,
                    {
                      borderColor: active ? theme.primary : theme.border,
                      borderWidth: active ? 2.5 : 1,
                    },
                  ]}
                >
                  {active && <Ionicons name="checkmark-circle" size={20} color={theme.primary} />}
                </LinearGradient>
                <Text
                  style={{
                    color: active ? theme.primary : theme.textSecondary,
                    fontSize: 11,
                    fontWeight: active ? '700' : '500',
                    marginTop: 5,
                  }}
                >
                  {wp.name}
                </Text>
              </Pressable>
            );
          })}

          <Pressable onPress={pickWallpaper} style={styles.wpItem}>
            <View
              style={[
                styles.wpPreview,
                {
                  backgroundColor: theme.bg,
                  borderColor:
                    settings.wallpaperId === 'custom' ? theme.primary : theme.border,
                  borderWidth: settings.wallpaperId === 'custom' ? 2.5 : 1,
                  borderStyle: 'dashed',
                },
              ]}
            >
              <Ionicons name="image-outline" size={20} color={theme.primary} />
            </View>
            <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 5 }}>
              自定义相册
            </Text>
          </Pressable>
        </ScrollView>

        <View style={styles.opacityRow}>
          <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '600' }}>
            卡片不透明度：{Math.round(settings.cardOpacity * 100)}%
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[0.75, 0.85, 0.92, 1.0].map((v) => (
              <Pressable
                key={v}
                onPress={() => updateSettings({ cardOpacity: v })}
                style={[
                  styles.opacityChip,
                  {
                    backgroundColor:
                      Math.abs(settings.cardOpacity - v) < 0.02 ? theme.primary : theme.bg,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color:
                      Math.abs(settings.cardOpacity - v) < 0.02 ? '#FFF' : theme.textSecondary,
                    fontSize: 11,
                    fontWeight: '700',
                  }}
                >
                  {Math.round(v * 100)}%
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* Semester Settings */}
      <View style={[styles.card, { backgroundColor: theme.surfaceGlass, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>学期与课表偏好</Text>

        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>学期名称</Text>
        <TextInput
          value={settings.semesterName}
          onChangeText={(t) => updateSettings({ semesterName: t })}
          style={[
            styles.input,
            { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border },
          ]}
        />

        <View style={styles.row2}>
          <View style={{ flex: 2 }}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
              第 1 周周一日期 (YYYY-MM-DD)
            </Text>
            <TextInput
              value={settings.semesterStartDate}
              onChangeText={(t) => updateSettings({ semesterStartDate: t })}
              placeholder="2026-09-07"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.input,
                { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border },
              ]}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>总周数</Text>
            <TextInput
              value={String(settings.totalWeeks)}
              keyboardType="number-pad"
              onChangeText={(t) => {
                const n = parseInt(t, 10);
                if (!isNaN(n) && n >= 1 && n <= 30) updateSettings({ totalWeeks: n });
              }}
              style={[
                styles.input,
                { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border },
              ]}
            />
          </View>
        </View>

        <View style={[styles.switchRow, { borderTopColor: theme.borderSubtle }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.switchLabel, { color: theme.text }]}>显示周六与周日</Text>
            <Text style={{ color: theme.textMuted, fontSize: 11 }}>关闭后课表仅展示周一至周五</Text>
          </View>
          <Switch
            value={settings.showWeekend}
            onValueChange={(v) => updateSettings({ showWeekend: v })}
            trackColor={{ false: theme.border, true: theme.primary }}
          />
        </View>

        <View style={[styles.switchRow, { borderTopColor: theme.borderSubtle }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.switchLabel, { color: theme.text }]}>显示非本周课程</Text>
            <Text style={{ color: theme.textMuted, fontSize: 11 }}>
              以半透明虚线卡片淡化展示单双周非本周课程
            </Text>
          </View>
          <Switch
            value={settings.showNonCurrentWeek}
            onValueChange={(v) => updateSettings({ showNonCurrentWeek: v })}
            trackColor={{ false: theme.border, true: theme.primary }}
          />
        </View>
      </View>

      {/* Custom Bell Schedule */}
      <View style={[styles.card, { backgroundColor: theme.surfaceGlass, borderColor: theme.border }]}>
        <Pressable
          onPress={() => setShowTimeEditor((prev) => !prev)}
          style={styles.collapseHeader}
        >
          <View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>自定义作息时间表</Text>
            <Text style={[styles.cardSub, { color: theme.textSecondary, marginBottom: 0 }]}>
              第 1 节 {timeSlots[0]?.startTime} 开始 · 共 {timeSlots.length} 节
            </Text>
          </View>
          <Ionicons
            name={showTimeEditor ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={theme.textSecondary}
          />
        </Pressable>

        {showTimeEditor && (
          <View style={{ marginTop: 12 }}>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <Pressable
                onPress={() => updateTimeSlots(STANDARD_TIME_SLOTS)}
                style={[styles.presetPill, { backgroundColor: theme.primarySoft }]}
              >
                <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '700' }}>
                  标准大学作息 (08:00)
                </Text>
              </Pressable>
              <Pressable
                onPress={() => updateTimeSlots(COMPACT_TIME_SLOTS)}
                style={[styles.presetPill, { backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border }]}
              >
                <Text style={{ color: theme.text, fontSize: 12, fontWeight: '700' }}>
                  早八半作息 (08:30)
                </Text>
              </Pressable>
            </View>

            {timeSlots.map((slot) => (
              <View
                key={slot.section}
                style={[styles.slotRow, { borderBottomColor: theme.borderSubtle }]}
              >
                <Text style={[styles.slotNum, { color: theme.text }]}>第 {slot.section} 节</Text>
                <TextInput
                  value={slot.startTime}
                  onChangeText={(v) => handleSlotChange(slot.section, 'startTime', v)}
                  style={[
                    styles.timeInput,
                    { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border },
                  ]}
                />
                <Text style={{ color: theme.textMuted }}>—</Text>
                <TextInput
                  value={slot.endTime}
                  onChangeText={(v) => handleSlotChange(slot.section, 'endTime', v)}
                  style={[
                    styles.timeInput,
                    { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border },
                  ]}
                />
              </View>
            ))}
          </View>
        )}
      </View>
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
  pageSub: {
    fontSize: 12,
    fontWeight: '600',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 2,
    marginBottom: 14,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  cardSub: {
    fontSize: 12,
    marginTop: 3,
    marginBottom: 12,
  },
  segRow: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
  },
  segBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 10,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  paletteCard: {
    width: '48.2%',
    borderRadius: 16,
    padding: 12,
  },
  paletteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paletteName: {
    fontSize: 14,
    fontWeight: '800',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 5,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  wallpaperRow: {
    gap: 12,
    paddingTop: 12,
    paddingBottom: 6,
  },
  wpItem: {
    alignItems: 'center',
  },
  wpPreview: {
    width: 58,
    height: 74,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opacityRow: {
    marginTop: 14,
    gap: 8,
  },
  opacityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  row2: {
    flexDirection: 'row',
    gap: 10,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    marginTop: 14,
    borderTopWidth: 1,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  collapseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  presetPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 12,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  slotNum: {
    width: 56,
    fontSize: 13,
    fontWeight: '700',
  },
  timeInput: {
    flex: 1,
    textAlign: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 6,
    fontSize: 13,
    fontWeight: '600',
  },
});
