import { AppSettings, Course, ScheduleBundle, TimeSlot, WeekType } from '../types/schedule';
import { formatWeeksText, getCourseTimeRange, getDateForWeekDay, parseWeekExpression } from './dateUtils';

function hashColorIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return hash % 12;
}

function inferWeekType(weeks: number[]): WeekType {
  if (weeks.length <= 1) return 'custom';
  const allOdd = weeks.every((w) => w % 2 === 1);
  const allEven = weeks.every((w) => w % 2 === 0);
  if (allOdd) return 'odd';
  if (allEven) return 'even';
  let contiguous = true;
  for (let i = 1; i < weeks.length; i++) {
    if (weeks[i] - weeks[i - 1] !== 1) {
      contiguous = false;
      break;
    }
  }
  return contiguous ? 'all' : 'custom';
}

function makeId(prefix = 'imp'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export interface ParseResult {
  courses: Course[];
  timeSlots?: TimeSlot[];
  sourceLabel: string;
}

/**
 * 1. Parse 新正方教务系统 (ZFSoft) JSON response (/kbcx/xskbcx_cxXsKb.html -> kbList)
 */
export function parseZFSoftJson(raw: string): ParseResult | null {
  try {
    const obj = JSON.parse(raw.trim());
    const kbList: any[] | undefined = Array.isArray(obj?.kbList)
      ? obj.kbList
      : Array.isArray(obj) && obj[0]?.kcmc && obj[0]?.xqj
      ? obj
      : undefined;

    if (!kbList || kbList.length === 0) return null;

    const courses: Course[] = [];
    for (const item of kbList) {
      const name = String(item.kcmc || item.courseName || '').trim();
      if (!name) continue;
      const day = Math.max(1, Math.min(7, parseInt(String(item.xqj || item.day || '1'), 10) || 1));

      // jcs is usually "1-2" or "3-4" or "1-3"
      const jcsStr = String(item.jcs || item.jc || '1-2');
      const jcsMatch = jcsStr.match(/(\d+)\s*[-~]\s*(\d+)/);
      const startSection = jcsMatch ? parseInt(jcsMatch[1], 10) : parseInt(jcsStr, 10) || 1;
      const endSection = jcsMatch ? parseInt(jcsMatch[2], 10) : startSection;

      const weeks = parseWeekExpression(String(item.zcd || '1-16周'));
      courses.push({
        id: makeId('zf'),
        name,
        teacher: String(item.xm || item.teacher || '未知教师').trim(),
        room: String(item.cdmc || item.room || '待定教室').trim(),
        day,
        startSection: Math.max(1, Math.min(12, startSection)),
        endSection: Math.max(1, Math.min(12, Math.max(startSection, endSection))),
        weeks,
        weekType: inferWeekType(weeks),
        colorIndex: hashColorIndex(name),
        credits: item.xf ? String(item.xf) : undefined,
        note: item.kcxz ? `${item.kcxz}${item.kcbj ? ` · ${item.kcbj}` : ''}` : undefined,
      });
    }

    if (courses.length === 0) return null;
    return { courses, sourceLabel: '新正方教务 JSON (kbList)' };
  } catch {
    return null;
  }
}

/**
 * 2. Parse WakeUp 课表 (.wakeup_schedule 5-line NDJSON OR WakeUp JSON array)
 */
export function parseWakeUpSchedule(raw: string): ParseResult | null {
  const trimmed = raw.trim();
  const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Standard 5-line .wakeup_schedule format
  if (lines.length >= 5) {
    try {
      const timeSlotsRaw = JSON.parse(lines[1]);
      const courseDefs = JSON.parse(lines[3]);
      const courseEntries = JSON.parse(lines[4]);

      if (Array.isArray(courseDefs) && Array.isArray(courseEntries)) {
        const defMap = new Map<number, any>();
        courseDefs.forEach((d: any) => defMap.set(d.id, d));

        const courses: Course[] = [];
        for (const entry of courseEntries) {
          const def = defMap.get(entry.id) || {};
          const name = String(def.courseName || entry.courseName || '').trim();
          if (!name) continue;
          const startWeek = Number(entry.startWeek) || 1;
          const endWeek = Number(entry.endWeek) || 16;
          const type = Number(entry.type) || 0; // 0=all, 1=odd, 2=even
          const weeks: number[] = [];
          for (let w = startWeek; w <= endWeek; w++) {
            if (type === 1 && w % 2 === 0) continue;
            if (type === 2 && w % 2 === 1) continue;
            weeks.push(w);
          }
          const startSection = Math.max(1, Number(entry.startNode) || 1);
          const step = Math.max(1, Number(entry.step) || 2);
          courses.push({
            id: makeId('wk'),
            name,
            teacher: String(entry.teacher || '未知教师').trim(),
            room: String(entry.room || '待定教室').trim(),
            day: Math.max(1, Math.min(7, Number(entry.day) || 1)),
            startSection,
            endSection: Math.min(12, startSection + step - 1),
            weeks: weeks.length > 0 ? weeks : [1],
            weekType: type === 1 ? 'odd' : type === 2 ? 'even' : 'all',
            colorIndex: hashColorIndex(name),
            credits: def.credit ? String(def.credit) : undefined,
          });
        }

        let timeSlots: TimeSlot[] | undefined;
        if (Array.isArray(timeSlotsRaw) && timeSlotsRaw.length > 0 && timeSlotsRaw[0]?.startTime) {
          timeSlots = timeSlotsRaw
            .filter((t: any) => t.node >= 1 && t.node <= 12)
            .map((t: any) => ({
              section: Number(t.node),
              startTime: String(t.startTime),
              endTime: String(t.endTime),
            }));
        }

        if (courses.length > 0) {
          return { courses, timeSlots, sourceLabel: 'WakeUp 课表 (.wakeup_schedule)' };
        }
      }
    } catch {
      // fall through
    }
  }

  // WakeUp single JSON object or array with nodeList / weekList
  try {
    const parsed = JSON.parse(trimmed);
    const arr = Array.isArray(parsed) ? parsed : parsed?.courseName ? [parsed] : null;
    if (arr && arr.length > 0 && arr[0]?.courseName) {
      const courses: Course[] = arr.map((item: any) => {
        const nodes: number[] = Array.isArray(item.nodeList) ? item.nodeList.map(Number) : [1, 2];
        const weeks: number[] = Array.isArray(item.weekList)
          ? item.weekList.map(Number)
          : parseWeekExpression(String(item.weeks || '1-16周'));
        const name = String(item.courseName).trim();
        return {
          id: makeId('wkj'),
          name,
          teacher: String(item.teacher || '未知教师').trim(),
          room: String(item.room || '待定教室').trim(),
          day: Math.max(1, Math.min(7, Number(item.day) || 1)),
          startSection: Math.min(...nodes),
          endSection: Math.max(...nodes),
          weeks,
          weekType: inferWeekType(weeks),
          colorIndex: hashColorIndex(name),
        };
      });
      return { courses, sourceLabel: 'WakeUp JSON 课表' };
    }
  } catch {
    // fall through
  }
  return null;
}

/**
 * 3. Parse ClassFlow native JSON backup
 */
export function parseClassFlowJson(raw: string): ParseResult | null {
  try {
    const obj = JSON.parse(raw.trim());
    const list = Array.isArray(obj?.courses) ? obj.courses : Array.isArray(obj) ? obj : null;
    if (!list || list.length === 0 || !list[0]?.name || !list[0]?.day) return null;

    const courses: Course[] = list.map((c: any) => {
      const weeks = Array.isArray(c.weeks)
        ? c.weeks.map(Number).filter((n: number) => !isNaN(n))
        : parseWeekExpression(String(c.weeks || '1-16周'));
      return {
        id: c.id || makeId('cf'),
        name: String(c.name).trim(),
        teacher: String(c.teacher || '').trim(),
        room: String(c.room || '').trim(),
        day: Math.max(1, Math.min(7, Number(c.day) || 1)),
        startSection: Math.max(1, Math.min(12, Number(c.startSection) || 1)),
        endSection: Math.max(1, Math.min(12, Number(c.endSection) || Number(c.startSection) || 2)),
        weeks,
        weekType: c.weekType || inferWeekType(weeks),
        colorIndex: typeof c.colorIndex === 'number' ? c.colorIndex % 12 : hashColorIndex(String(c.name)),
        note: c.note ? String(c.note) : undefined,
        credits: c.credits ? String(c.credits) : undefined,
      };
    });

    return {
      courses,
      timeSlots: Array.isArray(obj?.timeSlots) ? obj.timeSlots : undefined,
      sourceLabel: '拾光课表 JSON 备份',
    };
  } catch {
    return null;
  }
}

/**
 * 4. Parse 教务网页 HTML 表格源码 (兼容旧正方 / 强智 / 青果 / URP 表格 HTML)
 */
export function parseAcademicHtml(raw: string): ParseResult | null {
  if (!raw.includes('<tr') && !raw.includes('<td') && !raw.includes('timetable_con')) {
    return null;
  }
  const courses: Course[] = [];
  const rowMatches = raw.match(/<tr[\s\S]*?<\/tr>/gi);
  if (!rowMatches) return null;

  let sectionCursor = 1;
  for (const rowHtml of rowMatches) {
    const tdMatches = rowHtml.match(/<td[\s\S]*?<\/td>/gi);
    if (!tdMatches || tdMatches.length < 5) continue;

    // Detect section number from first header cell if present
    const firstText = tdMatches[0].replace(/<[^>]+>/g, ' ').trim();
    const secMatch = firstText.match(/第?\s*(\d+)\s*[-~]?\s*(\d+)?\s*节/);
    let rowStartSec = sectionCursor;
    let rowEndSec = Math.min(12, sectionCursor + 1);
    if (secMatch) {
      rowStartSec = parseInt(secMatch[1], 10);
      rowEndSec = secMatch[2] ? parseInt(secMatch[2], 10) : rowStartSec;
      sectionCursor = rowEndSec + 1;
    }

    // Iterate day columns (skip first column which is usually section label)
    const startCol = tdMatches.length >= 8 ? 1 : 0;
    for (let col = startCol; col < tdMatches.length && col - startCol < 7; col++) {
      const td = tdMatches[col];
      const day = col - startCol + 1;
      const rowspanMatch = td.match(/rowspan=["']?(\d+)/i);
      const rowspan = rowspanMatch ? parseInt(rowspanMatch[1], 10) : 1;

      const cleanText = td
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>|<\/div>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .trim();

      if (!cleanText || cleanText.length < 2) continue;

      const blocks = cleanText
        .split(/\n{2,}|-{3,}/)
        .map((b) => b.split('\n').map((l) => l.trim()).filter(Boolean))
        .filter((lines) => lines.length >= 1);

      for (const lines of blocks) {
        const name = lines[0].replace(/^\[.*?\]/, '').trim();
        if (!name || /^(星期|周[一二三四五六日]|上午|下午|晚上|节次|时间)/.test(name)) continue;

        const joined = lines.join(' ');
        const weekMatch = joined.match(/(\d+\s*[-~]\s*\d+\s*周?(?:\([单双]\)|[单双])?)/);
        const jcMatch = joined.match(/(\d+)\s*[-~]\s*(\d+)\s*节/);

        const startSec = jcMatch ? parseInt(jcMatch[1], 10) : rowStartSec;
        const endSec = jcMatch
          ? parseInt(jcMatch[2], 10)
          : Math.min(12, Math.max(rowEndSec, startSec + rowspan - 1));

        const weeks = parseWeekExpression(weekMatch ? weekMatch[1] : '1-16周');
        const teacher = lines.find((l, idx) => idx > 0 && l.length <= 12 && !/\d/.test(l)) || '教务导入';
        const room =
          lines.find((l, idx) => idx > 0 && l !== teacher && !l.includes('周')) ||
          lines[lines.length - 1] ||
          '待定教室';

        courses.push({
          id: makeId('html'),
          name,
          teacher,
          room: room === name ? '待定教室' : room,
          day,
          startSection: Math.max(1, Math.min(12, startSec)),
          endSection: Math.max(1, Math.min(12, Math.max(startSec, endSec))),
          weeks,
          weekType: inferWeekType(weeks),
          colorIndex: hashColorIndex(name),
        });
      }
    }
  }

  if (courses.length === 0) return null;
  return { courses, sourceLabel: '教务系统网页 HTML 课表' };
}

/**
 * 5. Parse CSV: 课程名称,星期(1-7),开始节次,结束节次,周次,教室,教师,备注
 */
export function parseCsvImport(raw: string): ParseResult | null {
  const lines = raw
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;

  const courses: Course[] = [];
  for (let i = 0; i < lines.length; i++) {
    const cols = lines[i].split(/[,，\t]/).map((c) => c.trim().replace(/^"|"$/g, ''));
    if (cols.length < 4) continue;
    // Skip header line
    if (i === 0 && (cols[0].includes('课程') || cols[0].toLowerCase().includes('name'))) continue;

    const name = cols[0];
    const day = parseInt(cols[1], 10);
    const startSection = parseInt(cols[2], 10);
    const endSection = parseInt(cols[3], 10);
    if (!name || isNaN(day) || isNaN(startSection)) continue;

    const weeks = parseWeekExpression(cols[4] || '1-16周');
    courses.push({
      id: makeId('csv'),
      name,
      day: Math.max(1, Math.min(7, day)),
      startSection: Math.max(1, Math.min(12, startSection)),
      endSection: Math.max(1, Math.min(12, isNaN(endSection) ? startSection : Math.max(startSection, endSection))),
      weeks,
      weekType: inferWeekType(weeks),
      room: cols[5] || '待定教室',
      teacher: cols[6] || '未知教师',
      note: cols[7] || undefined,
      colorIndex: hashColorIndex(name),
    });
  }

  if (courses.length === 0) return null;
  return { courses, sourceLabel: 'CSV 表格课表' };
}

/**
 * Smart auto-detector: tries all supported formats in priority order.
 */
export function smartParseSchedule(raw: string): ParseResult | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  return (
    parseZFSoftJson(trimmed) ||
    parseClassFlowJson(trimmed) ||
    parseWakeUpSchedule(trimmed) ||
    parseAcademicHtml(trimmed) ||
    parseCsvImport(trimmed)
  );
}

/**
 * Export full backup JSON
 */
export function exportToJson(courses: Course[], timeSlots: TimeSlot[], settings: AppSettings): string {
  const bundle: ScheduleBundle = {
    version: 1,
    exportedAt: new Date().toISOString(),
    courses,
    timeSlots,
    settings,
  };
  return JSON.stringify(bundle, null, 2);
}

/**
 * Export CSV string (UTF-8 with BOM for Excel compatibility)
 */
export function exportToCsv(courses: Course[]): string {
  const header = '课程名称,星期,开始节次,结束节次,周次,教室,教师,备注';
  const rows = courses.map((c) => {
    const safe = (v?: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    return [
      safe(c.name),
      c.day,
      c.startSection,
      c.endSection,
      safe(formatWeeksText(c.weeks)),
      safe(c.room),
      safe(c.teacher),
      safe(c.note),
    ].join(',');
  });
  return '\uFEFF' + [header, ...rows].join('\r\n');
}

/**
 * Export RFC 5545 .ics iCalendar file with exact dates & 15-minute VALARM alerts
 */
export function exportToIcs(courses: Course[], timeSlots: TimeSlot[], settings: AppSettings): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const formatIcsDateTime = (d: Date, hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(h || 8)}${pad(m || 0)}00`;
  };
  const escapeIcs = (s: string) =>
    s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ClassFlow//Timetable App//CN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcs(settings.semesterName || '拾光课表')}`,
    'X-WR-TIMEZONE:Asia/Shanghai',
  ];

  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');

  for (const course of courses) {
    const range = getCourseTimeRange(course, timeSlots);
    for (const week of course.weeks) {
      const date = getDateForWeekDay(settings.semesterStartDate, week, course.day);
      const dtStart = formatIcsDateTime(date, range.start);
      const dtEnd = formatIcsDateTime(date, range.end);
      const uid = `${course.id}-w${week}@classflow.app`;
      const desc = `教师：${course.teacher || '未知'}\\n节次：第${course.startSection}-${course.endSection}节\\n周次：第${week}周${
        course.note ? `\\n备注：${course.note}` : ''
      }`;

      lines.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${stamp}`,
        `DTSTART;TZID=Asia/Shanghai:${dtStart}`,
        `DTEND;TZID=Asia/Shanghai:${dtEnd}`,
        `SUMMARY:${escapeIcs(course.name)}`,
        `LOCATION:${escapeIcs(course.room || '')}`,
        `DESCRIPTION:${desc}`,
        'BEGIN:VALARM',
        'TRIGGER:-PT15M',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeIcs(`${course.name} 即将开始 (${course.room || ''})`)}`,
        'END:VALARM',
        'END:VEVENT'
      );
    }
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Injected JS script for mobile WebView to automatically extract timetable data
 * from 新正方 (ZFSoft / 大连海洋大学), 强智 (QZ), 青果 (Kingosoft), URP, and generic HTML tables.
 */
export const EDUCATION_SYSTEM_INJECT_JS = `
(function() {
  try {
    var payload = { type: 'CLASSFLOW_SCRAPE', format: 'none', data: '' };

    // Helper: parse 新正方 #kbgrid_table_0 directly into structured kbList JSON!
    function extractZFSoftGrid(doc) {
      var grid = doc.getElementById('kbgrid_table_0') || doc.querySelector('table.timetable_con') || doc.getElementById('ylkbTable');
      if (!grid) return null;

      var items = [];
      var cells = grid.querySelectorAll('td[id]');
      for (var i = 0; i < cells.length; i++) {
        var td = cells[i];
        var idParts = (td.id || '').split('-'); // e.g. "1-1" -> day 1, startNode 1
        var day = parseInt(idParts[0], 10);
        if (isNaN(day) || day < 1 || day > 7) continue;

        var blocks = td.querySelectorAll('.timetable_con');
        for (var b = 0; b < blocks.length; b++) {
          var blk = blocks[b];
          var titleEl = blk.querySelector('.title') || blk.querySelector('span.title') || blk.querySelector('font');
          var rawText = (blk.innerText || '').trim();
          if (!rawText) continue;
          var lines = rawText.split(/\\n+/).map(function(s){ return s.trim(); }).filter(Boolean);
          var name = titleEl ? (titleEl.innerText || '').trim() : (lines[0] || '');
          name = name.replace(/[★☆●◆]/g, '').trim();
          if (!name) continue;

          var full = lines.join(' ');
          var jcMatch = full.match(/(\\d+)\\s*[-~]\\s*(\\d+)\\s*节/);
          var zcMatch = full.match(/(\\d+(?:\\s*[-~]\\s*\\d+)?\\s*周(?:\\([单双]\\)|[单双])?(?:,\\s*\\d+(?:\\s*[-~]\\s*\\d+)?\\s*周(?:\\([单双]\\)|[单双])?)*)/);

          var room = '';
          var teacher = '';
          var ps = blk.querySelectorAll('p, font');
          for (var p = 0; p < ps.length; p++) {
            var pt = (ps[p].innerText || '').trim();
            var titleAttr = ps[p].getAttribute('title') || '';
            if (titleAttr.indexOf('上课地点') !== -1 || pt.indexOf('教室') !== -1) {
              room = pt.replace(/上课地点[:：]?/, '').trim();
            } else if (titleAttr.indexOf('教师') !== -1) {
              teacher = pt.replace(/教师[:：]?/, '').trim();
            }
          }
          if (!room && lines.length >= 3) room = lines[2];
          if (!teacher && lines.length >= 4) teacher = lines[3];

          var startSec = jcMatch ? parseInt(jcMatch[1], 10) : (parseInt(idParts[1], 10) || 1);
          var endSec = jcMatch ? parseInt(jcMatch[2], 10) : Math.min(12, startSec + 1);

          items.push({
            kcmc: name,
            xm: teacher || '教务导入',
            cdmc: room || '待定教室',
            xqj: String(day),
            jcs: startSec + '-' + endSec,
            zcd: zcMatch ? zcMatch[1] : '1-16周'
          });
        }
      }
      if (items.length > 0) return JSON.stringify({ kbList: items });
      return grid.outerHTML;
    }

    // 1. Check main document for 新正方
    var zfData = extractZFSoftGrid(document);
    if (zfData) {
      payload.format = zfData.charAt(0) === '{' ? 'json' : 'html';
      payload.data = zfData;
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      return true;
    }

    // 2. Check inside iframes (common in 新正方 / 旧正方 / 青果 / URP)
    var iframes = document.querySelectorAll('iframe');
    for (var i = 0; i < iframes.length; i++) {
      try {
        var doc = iframes[i].contentDocument || iframes[i].contentWindow.document;
        if (!doc) continue;
        var ifrZf = extractZFSoftGrid(doc);
        if (ifrZf) {
          payload.format = ifrZf.charAt(0) === '{' ? 'json' : 'html';
          payload.data = ifrZf;
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(payload));
          return true;
        }
        var tbl = doc.getElementById('kbtable') || doc.getElementById('timetable') || doc.querySelector('table');
        if (tbl && tbl.innerText && tbl.innerText.length > 60) {
          payload.format = 'html';
          payload.data = tbl.outerHTML;
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(payload));
          return true;
        }
      } catch (e) {}
    }

    // 3. Check 强智教务 (#kbtable / #timetable)
    var qzTable = document.getElementById('kbtable') || document.getElementById('timetable');
    if (qzTable) {
      payload.format = 'html';
      payload.data = qzTable.outerHTML;
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      return true;
    }

    // 4. Fallback: find largest table on page containing week/course keywords
    var tables = Array.from(document.querySelectorAll('table'));
    var best = null;
    for (var j = 0; j < tables.length; j++) {
      var txt = tables[j].innerText || '';
      if ((txt.indexOf('星期一') !== -1 || txt.indexOf('周一') !== -1) && txt.length > 80) {
        if (!best || txt.length > (best.innerText || '').length) best = tables[j];
      }
    }
    if (best) {
      payload.format = 'html';
      payload.data = best.outerHTML;
    } else {
      payload.format = 'html';
      payload.data = document.body ? document.body.innerHTML : '';
    }
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(payload));
  } catch (err) {
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'CLASSFLOW_SCRAPE',
      format: 'error',
      error: String(err)
    }));
  }
  true;
})();
`;

export const SAMPLE_ZFSOFT_JSON = JSON.stringify(
  {
    kbList: [
      {
        kcmc: '海洋科学导论',
        xm: '张海涛',
        cdmc: '海科楼 203',
        xqj: '1',
        jcs: '5-6',
        zcd: '1-16周',
        xf: '3.0',
        kcxz: '专业必修',
      },
      {
        kcmc: 'Python 数据分析',
        xm: '陈晓明',
        cdmc: '计算中心 402',
        xqj: '3',
        jcs: '1-2',
        zcd: '1-16周(双)',
        xf: '2.5',
        kcxz: '专业选修',
      },
      {
        kcmc: '概率论与数理统计',
        xm: '王芳',
        cdmc: '博学楼 C108',
        xqj: '5',
        jcs: '1-2',
        zcd: '1-16周',
        xf: '3.0',
        kcxz: '公共必修',
      },
    ],
  },
  null,
  2
);
