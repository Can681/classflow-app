import { AppSettings, Course, TimeSlot } from '../types/schedule';

export const STANDARD_TIME_SLOTS: TimeSlot[] = [
  { section: 1, startTime: '08:00', endTime: '08:45' },
  { section: 2, startTime: '08:55', endTime: '09:40' },
  { section: 3, startTime: '10:00', endTime: '10:45' },
  { section: 4, startTime: '10:55', endTime: '11:40' },
  { section: 5, startTime: '14:00', endTime: '14:45' },
  { section: 6, startTime: '14:55', endTime: '15:40' },
  { section: 7, startTime: '16:00', endTime: '16:45' },
  { section: 8, startTime: '16:55', endTime: '17:40' },
  { section: 9, startTime: '19:00', endTime: '19:45' },
  { section: 10, startTime: '19:55', endTime: '20:40' },
  { section: 11, startTime: '20:50', endTime: '21:35' },
  { section: 12, startTime: '21:40', endTime: '22:25' },
];

export const COMPACT_TIME_SLOTS: TimeSlot[] = [
  { section: 1, startTime: '08:30', endTime: '09:15' },
  { section: 2, startTime: '09:20', endTime: '10:05' },
  { section: 3, startTime: '10:25', endTime: '11:10' },
  { section: 4, startTime: '11:15', endTime: '12:00' },
  { section: 5, startTime: '13:30', endTime: '14:15' },
  { section: 6, startTime: '14:20', endTime: '15:05' },
  { section: 7, startTime: '15:25', endTime: '16:10' },
  { section: 8, startTime: '16:15', endTime: '17:00' },
  { section: 9, startTime: '18:30', endTime: '19:15' },
  { section: 10, startTime: '19:20', endTime: '20:05' },
  { section: 11, startTime: '20:15', endTime: '21:00' },
  { section: 12, startTime: '21:05', endTime: '21:50' },
];

/**
 * Compute a realistic default semester start Monday so that "today" falls on Week 12.
 */
export function getDefaultSemesterStartDate(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun..6=Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const thisMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
  // Go back 11 weeks so today is Week 12
  const week1Monday = new Date(thisMonday.getTime() - 11 * 7 * 24 * 60 * 60 * 1000);
  const y = week1Monday.getFullYear();
  const m = String(week1Monday.getMonth() + 1).padStart(2, '0');
  const d = String(week1Monday.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const DEFAULT_SETTINGS: AppSettings = {
  semesterName: '2026-2027 学年第一学期',
  semesterStartDate: getDefaultSemesterStartDate(),
  totalWeeks: 20,
  showWeekend: true,
  showNonCurrentWeek: true,
  themeMode: 'light',
  paletteId: 'morandi',
  wallpaperId: 'mist',
  customWallpaperUri: null,
  cardOpacity: 0.92,
};

function range(start: number, end: number, step = 1): number[] {
  const arr: number[] = [];
  for (let i = start; i <= end; i += step) arr.push(i);
  return arr;
}

export const SAMPLE_COURSES: Course[] = [
  {
    id: 'c-1',
    name: '数据结构与算法',
    teacher: '林致远',
    room: '信息楼 A302',
    day: 1,
    startSection: 1,
    endSection: 2,
    weeks: range(1, 16),
    weekType: 'all',
    colorIndex: 0,
    credits: '4.0',
    note: '带笔记本电脑，随堂算法演练',
  },
  {
    id: 'c-2',
    name: '高等数学 (上)',
    teacher: '周明德',
    room: '博学楼 B201',
    day: 1,
    startSection: 3,
    endSection: 4,
    weeks: range(1, 16),
    weekType: 'all',
    colorIndex: 1,
    credits: '5.0',
    note: '第 12 周交第四章习题册',
  },
  {
    id: 'c-3',
    name: '人工智能导论',
    teacher: '陈思源',
    room: '实验楼 C405',
    day: 1,
    startSection: 7,
    endSection: 8,
    weeks: range(1, 16),
    weekType: 'all',
    colorIndex: 4,
    credits: '3.0',
  },
  {
    id: 'c-4',
    name: '大学英语听说',
    teacher: 'Sarah Wu',
    room: '外语楼 208',
    day: 2,
    startSection: 1,
    endSection: 2,
    weeks: range(1, 16),
    weekType: 'all',
    colorIndex: 2,
    credits: '2.0',
  },
  {
    id: 'c-5',
    name: '线性代数',
    teacher: '李文博',
    room: '博学楼 A105',
    day: 2,
    startSection: 5,
    endSection: 6,
    weeks: range(1, 16),
    weekType: 'all',
    colorIndex: 3,
    credits: '3.0',
  },
  {
    id: 'c-6',
    name: 'UI/UX 交互设计',
    teacher: '苏婉清',
    room: '艺术楼 312',
    day: 2,
    startSection: 9,
    endSection: 10,
    weeks: range(2, 16, 2),
    weekType: 'even',
    colorIndex: 6,
    credits: '2.0',
    note: '双周上课，需带 Figma 原型作业',
  },
  {
    id: 'c-7',
    name: '数据结构与算法',
    teacher: '林致远',
    room: '信息楼 A302',
    day: 3,
    startSection: 3,
    endSection: 4,
    weeks: range(1, 16),
    weekType: 'all',
    colorIndex: 0,
    credits: '4.0',
  },
  {
    id: 'c-8',
    name: '体育 (羽毛球)',
    teacher: '张健',
    room: '综合体育馆 2F',
    day: 3,
    startSection: 7,
    endSection: 8,
    weeks: range(1, 16),
    weekType: 'all',
    colorIndex: 7,
    credits: '1.0',
    note: '穿运动鞋，自备球拍',
  },
  {
    id: 'c-9',
    name: '计算机组成原理',
    teacher: '赵建国',
    room: '信息楼 B401',
    day: 4,
    startSection: 1,
    endSection: 2,
    weeks: range(1, 16),
    weekType: 'all',
    colorIndex: 5,
    credits: '3.5',
  },
  {
    id: 'c-10',
    name: '高等数学 (上)',
    teacher: '周明德',
    room: '博学楼 B201',
    day: 4,
    startSection: 5,
    endSection: 6,
    weeks: range(1, 16),
    weekType: 'all',
    colorIndex: 1,
    credits: '5.0',
  },
  {
    id: 'c-11',
    name: '创新创业实践',
    teacher: '王海峰',
    room: '创客空间 102',
    day: 4,
    startSection: 9,
    endSection: 10,
    weeks: range(1, 15, 2),
    weekType: 'odd',
    colorIndex: 8,
    credits: '1.5',
    note: '单周上课（非本周时会自动淡化显示）',
  },
  {
    id: 'c-12',
    name: '移动应用开发实验',
    teacher: '许嘉豪',
    room: '软件实训室 506',
    day: 5,
    startSection: 3,
    endSection: 4,
    weeks: range(1, 16),
    weekType: 'all',
    colorIndex: 9,
    credits: '2.5',
  },
  {
    id: 'c-13',
    name: '中国近现代史纲要',
    teacher: '刘静',
    room: '人文楼 101',
    day: 5,
    startSection: 5,
    endSection: 6,
    weeks: range(1, 16),
    weekType: 'all',
    colorIndex: 10,
    credits: '2.0',
  },
  {
    id: 'c-14',
    name: '摄影与视觉美学',
    teacher: '顾言',
    room: '艺术楼 204',
    day: 6,
    startSection: 3,
    endSection: 4,
    weeks: range(4, 14),
    weekType: 'all',
    colorIndex: 11,
    credits: '1.5',
  },
];

export interface SchoolPreset {
  name: string;
  system: string;
  url: string;
  tip: string;
}

export const DLOU_SSO_URL =
  'https://portal.dlou.edu.cn/auth/cas/login?service=https%3A%2F%2Fjwxt.dlou.edu.cn%2Fsso%2Fddlogin';

export const SCHOOL_EDU_PRESETS: SchoolPreset[] = [
  {
    name: '大连海洋大学 (统一身份认证)',
    system: '大海大 · 新正方',
    url: DLOU_SSO_URL,
    tip: '使用学号与统一身份认证密码登录 → 进入「信息查询 → 学生课表查询」→ 点击下方「一键抓取」',
  },
  {
    name: '大连海洋大学 (教务直连)',
    system: '大海大 · 教务',
    url: 'https://jwxt.dlou.edu.cn/',
    tip: '已登录过统一身份认证或使用教务账号直接登录时可选此入口',
  },
  {
    name: '强智教务系统 (通用)',
    system: '强智 QZ',
    url: 'https://jwxt.dlou.edu.cn/jsxsd/',
    tip: '登录后进入「培养管理 → 学期理论课表」，点击一键抓取即可',
  },
  {
    name: '自定义学校教务网址',
    system: '新正方 / 青果 / URP',
    url: DLOU_SSO_URL,
    tip: '可在顶部地址栏直接输入任意高校教务系统网址',
  },
];
