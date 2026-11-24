import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useSchedule } from '../context/ScheduleContext';
import { SCHOOL_EDU_PRESETS } from '../constants/defaults';
import {
  SAMPLE_ZFSOFT_JSON,
  exportToCsv,
  exportToIcs,
  exportToJson,
  smartParseSchedule,
} from '../utils/parsers';
import { exportTextFile } from '../utils/fileActions';
import { EduWebViewModal } from '../components/EduWebViewModal';

export const ImportExportScreen: React.FC = () => {
  const {
    courses,
    timeSlots,
    settings,
    theme,
    importCourses,
    resetToSample,
    clearAllCourses,
  } = useSchedule();

  const insets = useSafeAreaInsets();
  const [pasteText, setPasteText] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [webViewOpen, setWebViewOpen] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState(SCHOOL_EDU_PRESETS[0].url);

  const showNotice = (type: 'ok' | 'err', text: string) => {
    setFeedback({ type, text });
  };

  const handleSmartImport = (rawText = pasteText) => {
    const parsed = smartParseSchedule(rawText);
    if (!parsed || parsed.courses.length === 0) {
      showNotice(
        'err',
        '未能识别课表内容。请检查是否为新正方 kbList JSON、教务网页 HTML、WakeUp 课表、JSON 或 CSV 格式。'
      );
      return;
    }
    importCourses(parsed.courses, importMode, parsed.timeSlots);
    showNotice(
      'ok',
      `成功从「${parsed.sourceLabel}」${importMode === 'replace' ? '覆盖' : '追加'}导入 ${
        parsed.courses.length
      } 门课程！`
    );
    setPasteText('');
  };

  const handlePickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets || res.assets.length === 0) return;
      const asset = res.assets[0];
      let content = '';
      if (Platform.OS === 'web' && (asset as any).file) {
        content = await (asset as any).file.text();
      } else {
        content = await FileSystem.readAsStringAsync(asset.uri);
      }
      handleSmartImport(content);
    } catch (err: any) {
      showNotice('err', `读取文件失败：${err?.message || '未知错误'}`);
    }
  };

  const handleExport = async (kind: 'ics' | 'json' | 'csv') => {
    if (courses.length === 0) {
      showNotice('err', '当前课表为空，无法导出');
      return;
    }
    const stamp = new Date().toISOString().slice(0, 10);
    if (kind === 'ics') {
      const ics = exportToIcs(courses, timeSlots, settings);
      const r = await exportTextFile(`classflow-${stamp}.ics`, ics, 'text/calendar;charset=utf-8');
      showNotice(r.ok ? 'ok' : 'err', r.message);
    } else if (kind === 'json') {
      const json = exportToJson(courses, timeSlots, settings);
      const r = await exportTextFile(`classflow-backup-${stamp}.json`, json, 'application/json;charset=utf-8');
      showNotice(r.ok ? 'ok' : 'err', r.message);
    } else {
      const csv = exportToCsv(courses);
      const r = await exportTextFile(`classflow-${stamp}.csv`, csv, 'text/csv;charset=utf-8');
      showNotice(r.ok ? 'ok' : 'err', r.message);
    }
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
        支持新旧正方 · 强智 · 青果 · URP · WakeUp
      </Text>
      <Text style={[styles.pageTitle, { color: theme.text }]}>教务导入与同步</Text>

      {feedback ? (
        <View
          style={[
            styles.noticeBanner,
            {
              backgroundColor: feedback.type === 'ok' ? theme.successSoft : theme.dangerSoft,
              borderColor: feedback.type === 'ok' ? theme.success : theme.danger,
            },
          ]}
        >
          <Ionicons
            name={feedback.type === 'ok' ? 'checkmark-circle' : 'alert-circle'}
            size={18}
            color={feedback.type === 'ok' ? theme.success : theme.danger}
          />
          <Text
            style={{
              flex: 1,
              fontSize: 13,
              fontWeight: '600',
              color: feedback.type === 'ok' ? theme.success : theme.danger,
            }}
          >
            {feedback.text}
          </Text>
          <Pressable onPress={() => setFeedback(null)} hitSlop={8}>
            <Ionicons
              name="close"
              size={16}
              color={feedback.type === 'ok' ? theme.success : theme.danger}
            />
          </Pressable>
        </View>
      ) : null}

      {/* Card 1: Built-in Edu WebView Browser */}
      <View
        style={[
          styles.card,
          { backgroundColor: theme.surfaceGlass, borderColor: theme.border },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconBadge, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="school" size={20} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>教务系统一键抓取导入</Text>
            <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
              内置浏览器登录学校教务，进入课表页一键识别解析
            </Text>
          </View>
        </View>

        <View style={styles.presetGrid}>
          {SCHOOL_EDU_PRESETS.map((p) => (
            <Pressable
              key={p.name}
              onPress={() => {
                setWebViewUrl(p.url);
                setWebViewOpen(true);
              }}
              style={({ pressed }) => [
                styles.presetTile,
                {
                  backgroundColor: theme.bg,
                  borderColor: theme.border,
                  opacity: pressed ? 0.78 : 1,
                },
              ]}
            >
              <Text style={[styles.presetSystem, { color: theme.primary }]}>{p.system}</Text>
              <Text style={[styles.presetName, { color: theme.text }]} numberOfLines={1}>
                {p.name}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={() => setWebViewOpen(true)}
          style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
        >
          <Ionicons name="globe-outline" size={18} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>打开内置教务浏览器</Text>
        </Pressable>
      </View>

      {/* Card 2: Smart Paste / File Import */}
      <View
        style={[
          styles.card,
          { backgroundColor: theme.surfaceGlass, borderColor: theme.border },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconBadge, { backgroundColor: 'rgba(16, 185, 129, 0.14)' }]}>
            <Ionicons name="code-slash" size={19} color="#10B981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              教务 JSON / 网页源码 / WakeUp 导入
            </Text>
            <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
              自动识别正方 kbList JSON、教务 HTML、.wakeup_schedule、CSV 或备份 JSON
            </Text>
          </View>
        </View>

        {/* Merge / Replace toggle */}
        <View style={[styles.segRow, { backgroundColor: theme.bg, borderColor: theme.border }]}>
          {(
            [
              { key: 'merge', label: '追加到当前课表' },
              { key: 'replace', label: '覆盖当前课表' },
            ] as const
          ).map((opt) => (
            <Pressable
              key={opt.key}
              onPress={() => setImportMode(opt.key)}
              style={[
                styles.segBtn,
                importMode === opt.key && { backgroundColor: theme.primary },
              ]}
            >
              <Text
                style={{
                  color: importMode === opt.key ? '#FFF' : theme.textSecondary,
                  fontSize: 12,
                  fontWeight: '700',
                }}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          value={pasteText}
          onChangeText={setPasteText}
          multiline
          numberOfLines={5}
          placeholder="在此粘贴新正方 kbList JSON、教务网页表格 HTML、WakeUp 分享文件或 CSV 内容..."
          placeholderTextColor={theme.textMuted}
          textAlignVertical="top"
          style={[
            styles.textArea,
            { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border },
          ]}
        />

        <View style={styles.btnRow}>
          <Pressable
            onPress={() => setPasteText(SAMPLE_ZFSOFT_JSON)}
            style={[styles.secondaryBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}
          >
            <Ionicons name="flask-outline" size={15} color={theme.primary} />
            <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '700' }}>
              填入正方示例
            </Text>
          </Pressable>

          <Pressable
            onPress={handlePickFile}
            style={[styles.secondaryBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}
          >
            <Ionicons name="document-attach-outline" size={15} color={theme.text} />
            <Text style={{ color: theme.text, fontSize: 12, fontWeight: '700' }}>选择本地文件</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => handleSmartImport()}
          style={[
            styles.primaryBtn,
            {
              backgroundColor: pasteText.trim() ? theme.primary : theme.textMuted,
              marginTop: 10,
            },
          ]}
        >
          <Ionicons name="sparkles" size={17} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>智能解析并导入</Text>
        </Pressable>
      </View>

      {/* Card 3: Export */}
      <View
        style={[
          styles.card,
          { backgroundColor: theme.surfaceGlass, borderColor: theme.border },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconBadge, { backgroundColor: 'rgba(245, 158, 11, 0.14)' }]}>
            <Ionicons name="share-outline" size={20} color="#F59E0B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>导出与系统日历同步</Text>
            <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
              当前共有 {courses.length} 门课程，支持一键导出至 iOS / Android / Google 日历
            </Text>
          </View>
        </View>

        <View style={styles.exportRow}>
          <Pressable
            onPress={() => handleExport('ics')}
            style={[styles.exportTile, { backgroundColor: theme.bg, borderColor: theme.border }]}
          >
            <Ionicons name="calendar" size={22} color={theme.primary} />
            <Text style={[styles.exportLabel, { color: theme.text }]}>ICS 日历</Text>
            <Text style={[styles.exportHint, { color: theme.textMuted }]}>含15分提醒</Text>
          </Pressable>

          <Pressable
            onPress={() => handleExport('json')}
            style={[styles.exportTile, { backgroundColor: theme.bg, borderColor: theme.border }]}
          >
            <Ionicons name="code-download" size={22} color="#10B981" />
            <Text style={[styles.exportLabel, { color: theme.text }]}>JSON 备份</Text>
            <Text style={[styles.exportHint, { color: theme.textMuted }]}>完整配置</Text>
          </Pressable>

          <Pressable
            onPress={() => handleExport('csv')}
            style={[styles.exportTile, { backgroundColor: theme.bg, borderColor: theme.border }]}
          >
            <Ionicons name="grid" size={22} color="#F59E0B" />
            <Text style={[styles.exportLabel, { color: theme.text }]}>CSV 表格</Text>
            <Text style={[styles.exportHint, { color: theme.textMuted }]}>Excel 兼容</Text>
          </Pressable>
        </View>
      </View>

      {/* Card 4: Quick Demo Data */}
      <View
        style={[
          styles.card,
          { backgroundColor: theme.surfaceGlass, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 10 }]}>数据快捷管理</Text>
        <View style={styles.btnRow}>
          <Pressable
            onPress={() => {
              resetToSample();
              showNotice('ok', '已恢复精美示例课表与默认作息时间');
            }}
            style={[styles.secondaryBtn, { backgroundColor: theme.primarySoft, borderColor: 'transparent' }]}
          >
            <Ionicons name="refresh" size={15} color={theme.primary} />
            <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '700' }}>
              恢复示例课表
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              clearAllCourses();
              showNotice('ok', '已清空所有课程');
            }}
            style={[styles.secondaryBtn, { backgroundColor: theme.dangerSoft, borderColor: 'transparent' }]}
          >
            <Ionicons name="trash-outline" size={15} color={theme.danger} />
            <Text style={{ color: theme.danger, fontSize: 12, fontWeight: '700' }}>清空课表</Text>
          </Pressable>
        </View>
      </View>

      <EduWebViewModal
        visible={webViewOpen}
        initialUrl={webViewUrl}
        onClose={() => setWebViewOpen(false)}
        onImported={(imported, sourceLabel) => {
          importCourses(imported, importMode);
          showNotice('ok', `成功从「${sourceLabel}」导入 ${imported.length} 门课程！`);
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
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  cardSub: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  presetTile: {
    width: '48.5%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 11,
  },
  presetSystem: {
    fontSize: 11,
    fontWeight: '800',
  },
  presetName: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 15,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  segRow: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  segBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  textArea: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    fontSize: 12,
    minHeight: 104,
    marginBottom: 10,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 13,
    borderWidth: 1,
  },
  exportRow: {
    flexDirection: 'row',
    gap: 10,
  },
  exportTile: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 5,
  },
  exportLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  exportHint: {
    fontSize: 10,
  },
});
