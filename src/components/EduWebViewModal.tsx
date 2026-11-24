import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSchedule } from '../context/ScheduleContext';
import { EDUCATION_SYSTEM_INJECT_JS, smartParseSchedule } from '../utils/parsers';
import { DLOU_SSO_URL, SCHOOL_EDU_PRESETS } from '../constants/defaults';
import { Course } from '../types/schedule';

let NativeWebView: any = null;
if (Platform.OS !== 'web') {
  try {
    NativeWebView = require('react-native-webview').WebView;
  } catch {
    NativeWebView = null;
  }
}

const MOBILE_CHROME_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';

// Rewrite window.open and target="_blank" so 新正方 menu links open inside the same WebView
const SINGLE_WINDOW_SHIM_JS = `
(function() {
  window.open = function(url) {
    if (url) { window.location.href = url; }
    return window;
  };
  document.addEventListener('click', function(e) {
    var a = e.target && e.target.closest ? e.target.closest('a[target="_blank"]') : null;
    if (a && a.href) {
      a.removeAttribute('target');
    }
  }, true);
})();
true;
`;

interface EduWebViewModalProps {
  visible: boolean;
  initialUrl?: string;
  onClose: () => void;
  onImported: (courses: Course[], sourceLabel: string) => void;
}

export const EduWebViewModal: React.FC<EduWebViewModalProps> = ({
  visible,
  initialUrl = DLOU_SSO_URL,
  onClose,
  onImported,
}) => {
  const { theme } = useSchedule();
  const webViewRef = useRef<any>(null);
  const [urlInput, setUrlInput] = useState(initialUrl);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(
    '登录统一身份认证 → 进入「学生课表查询」→ 点击下方「一键抓取」'
  );
  const [scraping, setScraping] = useState(false);

  // Sync URL whenever modal opens with a chosen preset
  useEffect(() => {
    if (visible && initialUrl) {
      setUrlInput(initialUrl);
      setCurrentUrl(initialUrl);
      setStatusMsg('正在打开教务系统，请使用学号登录后进入课表页面...');
    }
  }, [visible, initialUrl]);

  const navigateTo = (target: string) => {
    let cleaned = target.trim();
    if (!cleaned) return;
    if (!/^https?:\/\//i.test(cleaned)) {
      cleaned = `https://${cleaned}`;
    }
    setUrlInput(cleaned);
    setCurrentUrl(cleaned);
  };

  const triggerScrape = () => {
    if (!webViewRef.current) return;
    setScraping(true);
    setStatusMsg('正在扫描当前页面课表数据...');
    webViewRef.current.injectJavaScript(EDUCATION_SYSTEM_INJECT_JS);
  };

  const handleWebViewMessage = (event: any) => {
    setScraping(false);
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg?.type === 'CLASSFLOW_SCRAPE') {
        if (msg.format === 'error') {
          setStatusMsg(`抓取失败：${msg.error}`);
          return;
        }
        const parsed = smartParseSchedule(msg.data || '');
        if (parsed && parsed.courses.length > 0) {
          onImported(parsed.courses, `教务内置浏览器 (${parsed.sourceLabel})`);
          onClose();
        } else {
          setStatusMsg('未识别到课表表格，请确认已进入「个人课表查询」且课表已加载完成后重试');
        }
      }
    } catch {
      setStatusMsg('解析返回数据失败，请重试或使用源码粘贴模式');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: theme.bg }]}>
        {/* Top Browser Bar */}
        <View
          style={[
            styles.topBar,
            { backgroundColor: theme.surface, borderBottomColor: theme.border },
          ]}
        >
          <Pressable onPress={onClose} style={styles.iconBtn} hitSlop={8}>
            <Ionicons name="close" size={22} color={theme.text} />
          </Pressable>
          <View style={[styles.urlBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            {loading ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Ionicons name="lock-closed" size={13} color={theme.textMuted} />
            )}
            <TextInput
              value={urlInput}
              onChangeText={setUrlInput}
              onSubmitEditing={() => navigateTo(urlInput)}
              placeholder="输入学校教务系统网址..."
              placeholderTextColor={theme.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="go"
              style={[styles.urlInput, { color: theme.text }]}
            />
          </View>
          <Pressable
            onPress={() => navigateTo(urlInput)}
            style={[styles.goBtn, { backgroundColor: theme.primary }]}
          >
            <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>前往</Text>
          </Pressable>
        </View>

        {/* Status Banner */}
        <View style={[styles.statusBar, { backgroundColor: theme.primarySoft }]}>
          <Ionicons name="information-circle" size={15} color={theme.primary} />
          <Text style={[styles.statusText, { color: theme.primary }]} numberOfLines={2}>
            {statusMsg}
          </Text>
        </View>

        {Platform.OS !== 'web' && NativeWebView ? (
          <View style={{ flex: 1 }}>
            <NativeWebView
              ref={webViewRef}
              source={{ uri: currentUrl }}
              userAgent={MOBILE_CHROME_UA}
              originWhitelist={['*']}
              javaScriptEnabled
              domStorageEnabled
              sharedCookiesEnabled
              thirdPartyCookiesEnabled
              mixedContentMode="always"
              setSupportMultipleWindows={false}
              javaScriptCanOpenWindowsAutomatically
              allowsInlineMediaPlayback
              injectedJavaScriptBeforeContentLoaded={SINGLE_WINDOW_SHIM_JS}
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => {
                setLoading(false);
                webViewRef.current?.injectJavaScript(SINGLE_WINDOW_SHIM_JS);
              }}
              onError={(e: any) => {
                setLoading(false);
                const desc = e?.nativeEvent?.description || '网络连接失败';
                setStatusMsg(`页面加载失败 (${desc})。若在校外访问，请先连接学校 VPN 或校园网后点击刷新`);
              }}
              onHttpError={(e: any) => {
                setLoading(false);
                setStatusMsg(`服务器返回 HTTP ${e?.nativeEvent?.statusCode || ''}，可尝试刷新或检查网络`);
              }}
              onNavigationStateChange={(nav: any) => {
                if (nav?.url) setUrlInput(nav.url);
              }}
              onMessage={handleWebViewMessage}
              style={{ flex: 1 }}
            />
            {/* Bottom Action Bar */}
            <View
              style={[
                styles.bottomBar,
                { backgroundColor: theme.surface, borderTopColor: theme.border },
              ]}
            >
              <Pressable
                onPress={() => webViewRef.current?.goBack()}
                style={[styles.navBtn, { backgroundColor: theme.bg }]}
              >
                <Ionicons name="chevron-back" size={18} color={theme.text} />
              </Pressable>
              <Pressable
                onPress={() => webViewRef.current?.reload()}
                style={[styles.navBtn, { backgroundColor: theme.bg }]}
              >
                <Ionicons name="refresh" size={18} color={theme.text} />
              </Pressable>
              <Pressable
                onPress={triggerScrape}
                disabled={scraping}
                style={[styles.scrapeBtn, { backgroundColor: theme.primary }]}
              >
                <Ionicons name="sparkles" size={17} color="#FFF" />
                <Text style={styles.scrapeBtnText}>
                  {scraping ? '正在识别课表...' : '一键抓取当前页课表'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.webFallback}>
            <View
              style={[
                styles.webCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={[styles.webIconWrap, { backgroundColor: theme.primarySoft }]}>
                <Ionicons name="phone-portrait-outline" size={32} color={theme.primary} />
              </View>
              <Text style={[styles.webTitle, { color: theme.text }]}>
                内置教务 WebView 浏览器（移动端专属）
              </Text>
              <Text style={[styles.webDesc, { color: theme.textSecondary }]}>
                在手机 App 中，此窗口会直接打开大连海洋大学统一身份认证页面，登录后进入课表页即可一键抓取导入。
              </Text>
              <Text style={[styles.presetTitle, { color: theme.text }]}>已内置教务入口：</Text>
              {SCHOOL_EDU_PRESETS.map((p) => (
                <View
                  key={p.name}
                  style={[styles.presetRow, { backgroundColor: theme.bg, borderColor: theme.border }]}
                >
                  <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>
                    {p.name}
                  </Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>
                    {p.tip}
                  </Text>
                </View>
              ))}
              <Pressable
                onPress={onClose}
                style={[
                  styles.scrapeBtn,
                  { backgroundColor: theme.primary, marginTop: 16, width: '100%' },
                ]}
              >
                <Text style={styles.scrapeBtnText}>返回使用源码 / JSON 智能导入</Text>
              </Pressable>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 46 : 12,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
  },
  iconBtn: {
    padding: 4,
  },
  urlBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 38,
  },
  urlInput: {
    flex: 1,
    fontSize: 13,
  },
  goBtn: {
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  statusText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    borderTopWidth: 1,
  },
  navBtn: {
    width: 42,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrapeBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scrapeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  webFallback: {
    padding: 20,
    alignItems: 'center',
  },
  webCard: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    alignItems: 'center',
  },
  webIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  webTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  webDesc: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  presetTitle: {
    alignSelf: 'flex-start',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 18,
    marginBottom: 8,
  },
  presetRow: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
});
