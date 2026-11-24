import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Cross-platform file export:
 * - On Web: triggers an immediate browser file download.
 * - On iOS / Android: writes to app cache directory and invokes native Share Sheet.
 */
export async function exportTextFile(
  filename: string,
  content: string,
  mimeType = 'text/plain;charset=utf-8'
): Promise<{ ok: boolean; message: string }> {
  try {
    if (Platform.OS === 'web') {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return { ok: true, message: `已下载 ${filename}` };
    }

    const baseDir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory;
    if (!baseDir) {
      return { ok: false, message: '无法访问本地缓存目录' };
    }
    const fileUri = `${baseDir}${filename}`;
    await FileSystem.writeAsStringAsync(fileUri, content);
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType,
        dialogTitle: `导出 ${filename}`,
      });
      return { ok: true, message: `已生成并分享 ${filename}` };
    }
    return { ok: true, message: `已保存至 ${fileUri}` };
  } catch (err: any) {
    return { ok: false, message: err?.message || '导出失败' };
  }
}
