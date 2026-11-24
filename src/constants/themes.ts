import { PaletteId, WallpaperId } from '../types/schedule';

export interface CourseColorToken {
  bgLight: string;
  borderLight: string;
  textLight: string;
  subTextLight: string;
  bgDark: string;
  borderDark: string;
  textDark: string;
  subTextDark: string;
  accent: string;
}

export interface ColorPalette {
  id: PaletteId;
  name: string;
  subtitle: string;
  colors: CourseColorToken[];
}

export interface UITheme {
  isDark: boolean;
  bg: string;
  surface: string;
  surfaceElevated: string;
  surfaceGlass: string;
  border: string;
  borderSubtle: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primarySoft: string;
  danger: string;
  dangerSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  tabBarBg: string;
  shadowColor: string;
}

export const LIGHT_THEME: UITheme = {
  isDark: false,
  bg: '#F4F6FA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceGlass: 'rgba(255, 255, 255, 0.84)',
  border: 'rgba(15, 23, 42, 0.08)',
  borderSubtle: 'rgba(15, 23, 42, 0.045)',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  primary: '#4F6EF7',
  primarySoft: 'rgba(79, 110, 247, 0.12)',
  danger: '#E5484D',
  dangerSoft: 'rgba(229, 72, 77, 0.12)',
  success: '#16A34A',
  successSoft: 'rgba(22, 163, 74, 0.12)',
  warning: '#EA580C',
  tabBarBg: 'rgba(255, 255, 255, 0.92)',
  shadowColor: '#0F172A',
};

export const DARK_THEME: UITheme = {
  isDark: true,
  bg: '#0C1018',
  surface: '#151B27',
  surfaceElevated: '#1C2434',
  surfaceGlass: 'rgba(21, 27, 39, 0.82)',
  border: 'rgba(255, 255, 255, 0.09)',
  borderSubtle: 'rgba(255, 255, 255, 0.045)',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  primary: '#7490FF',
  primarySoft: 'rgba(116, 144, 255, 0.18)',
  danger: '#FF6B6B',
  dangerSoft: 'rgba(255, 107, 107, 0.16)',
  success: '#34D399',
  successSoft: 'rgba(52, 211, 153, 0.16)',
  warning: '#FB923C',
  tabBarBg: 'rgba(21, 27, 39, 0.92)',
  shadowColor: '#000000',
};

function makeToken(
  accent: string,
  bgLight: string,
  textLight: string,
  bgDark: string,
  textDark: string
): CourseColorToken {
  return {
    accent,
    bgLight,
    borderLight: `${accent}40`,
    textLight,
    subTextLight: `${textLight}B8`,
    bgDark,
    borderDark: `${accent}55`,
    textDark,
    subTextDark: `${textDark}C2`,
  };
}

export const COLOR_PALETTES: Record<PaletteId, ColorPalette> = {
  morandi: {
    id: 'morandi',
    name: '莫兰迪',
    subtitle: '低饱和温柔质感',
    colors: [
      makeToken('#6E8BA3', '#E8F0F5', '#274054', '#1F2D3A', '#D5E5F2'),
      makeToken('#C48A8A', '#F7EAEB', '#5A2C2E', '#382224', '#F5D6D7'),
      makeToken('#7FA38B', '#E9F2EC', '#274734', '#1E3126', '#D4EBDC'),
      makeToken('#C6A378', '#F6EFE6', '#563D1F', '#362B1E', '#F3E3CE'),
      makeToken('#9386B5', '#EFEBF7', '#3B2F59', '#2A243B', '#E2DAF7'),
      makeToken('#6FA6A6', '#E7F3F3', '#214A4A', '#1C3232', '#D1ECEC'),
      makeToken('#C48FA8', '#F7ECF1', '#582B41', '#38222D', '#F5D8E6'),
      makeToken('#8B9E75', '#EEF3E7', '#354524', '#26301C', '#DFEBCE'),
      makeToken('#B88B72', '#F5ECE6', '#513121', '#35261E', '#F0DDD1'),
      makeToken('#7B90BD', '#EBF0F9', '#2A3B61', '#212A3E', '#D9E3F7'),
      makeToken('#A89578', '#F3EFE8', '#4A3D29', '#302A20', '#EAE1D2'),
      makeToken('#8A8FA3', '#ECEEF3', '#33384D', '#252833', '#DCE0EB'),
    ],
  },
  macaron: {
    id: 'macaron',
    name: '马卡龙',
    subtitle: '清新明快甜美色系',
    colors: [
      makeToken('#4F9CF9', '#E6F2FF', '#154480', '#192E47', '#CFE5FF'),
      makeToken('#FF7597', '#FFE8EE', '#851A36', '#421C27', '#FFD0DC'),
      makeToken('#34C78A', '#E4F9F0', '#0F5C3C', '#163829', '#C8F4E1'),
      makeToken('#FFA94D', '#FFF1E2', '#7D4107', '#402B16', '#FFE0BE'),
      makeToken('#9775FA', '#F0EBFF', '#41238A', '#2B2047', '#DFD4FF'),
      makeToken('#38BDF8', '#E5F6FE', '#0F4D6E', '#153242', '#CBEBFC'),
      makeToken('#F472B6', '#FCE8F3', '#7A194E', '#3F1C30', '#FAD0E7'),
      makeToken('#A3C940', '#F2F9DF', '#3D520A', '#2B3615', '#E5F2BF'),
      makeToken('#FB7185', '#FFE9EC', '#821728', '#421C22', '#FFD1D8'),
      makeToken('#2DD4BF', '#E3FAF6', '#0E574E', '#143632', '#C6F4ED'),
      makeToken('#FBBF24', '#FEF6DC', '#704E05', '#3D3114', '#FDEAA8'),
      makeToken('#818CF8', '#ECEEFF', '#293082', '#222647', '#D8DCFF'),
    ],
  },
  aurora: {
    id: 'aurora',
    name: '极光',
    subtitle: '通透现代高辨识度',
    colors: [
      makeToken('#5B6CFF', '#E8EBFF', '#202B8A', '#1E234A', '#D6DCFF'),
      makeToken('#00B894', '#E2F8F3', '#055746', '#11362E', '#C2F2E7'),
      makeToken('#FF6B6B', '#FFE8E8', '#871C1C', '#451D1D', '#FFD1D1'),
      makeToken('#F59E0B', '#FEF3DC', '#784805', '#3E2D13', '#FDE3B0'),
      makeToken('#A855F7', '#F3E8FF', '#521A85', '#311C47', '#E6D0FF'),
      makeToken('#06B6D4', '#E2F7FB', '#085261', '#12333B', '#C2EEF7'),
      makeToken('#EC4899', '#FCE7F3', '#80174B', '#421A30', '#F9CBE4'),
      makeToken('#10B981', '#E3F8F0', '#09573B', '#123629', '#C4F1E0'),
      makeToken('#F97316', '#FFEDE0', '#7D3408', '#422514', '#FFD8BC'),
      makeToken('#3B82F6', '#E5F0FF', '#14418A', '#182C4A', '#CBE0FF'),
      makeToken('#14B8A6', '#E2F8F5', '#0B544C', '#123632', '#C2F0EA'),
      makeToken('#6366F1', '#EAEBFF', '#292A87', '#21224A', '#D6D8FF'),
    ],
  },
  ink: {
    id: 'ink',
    name: '纸墨',
    subtitle: '极简学院风高对比',
    colors: [
      makeToken('#334155', '#E9EEF4', '#1E293B', '#212A36', '#E2E8F0'),
      makeToken('#475569', '#ECEFF3', '#1E293B', '#252D38', '#E2E8F0'),
      makeToken('#3F6212', '#ECF3E5', '#283F0B', '#232F18', '#D9EBC5'),
      makeToken('#7C2D12', '#F5EAE6', '#4D1C0B', '#36211A', '#F0D5CC'),
      makeToken('#1E3A8A', '#E7ECF7', '#172C69', '#1B2642', '#D1DCF5'),
      makeToken('#581C87', '#F1E9F7', '#3B125C', '#2D1D3B', '#E4D2F5'),
      makeToken('#115E59', '#E5F2F1', '#0B3E3B', '#17302E', '#CCEAE8'),
      makeToken('#854D0E', '#F6F0E4', '#543008', '#362B17', '#EFE0C4'),
      makeToken('#881337', '#F7E9ED', '#570C23', '#381B24', '#F2CED8'),
      makeToken('#0F766E', '#E5F4F2', '#0A4B46', '#163330', '#CBEBE7'),
      makeToken('#4338CA', '#EAE9F9', '#2A2282', '#232045', '#D6D4F7'),
      makeToken('#64748B', '#EDF0F4', '#273242', '#252C36', '#DDE3EB'),
    ],
  },
};

export interface WallpaperPreset {
  id: WallpaperId;
  name: string;
  lightColors: [string, string, string];
  darkColors: [string, string, string];
  preview: [string, string];
}

export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  {
    id: 'none',
    name: '纯净极简',
    lightColors: ['#F4F6FA', '#F4F6FA', '#EEF1F7'],
    darkColors: ['#0C1018', '#0C1018', '#101520'],
    preview: ['#F4F6FA', '#E2E8F0'],
  },
  {
    id: 'mist',
    name: '晨雾微蓝',
    lightColors: ['#E6F0FF', '#F3F7FF', '#EAE8FF'],
    darkColors: ['#0D1628', '#121C33', '#191A33'],
    preview: ['#C7DDFE', '#E2DAFF'],
  },
  {
    id: 'sakura',
    name: '樱花晚霞',
    lightColors: ['#FFE9F0', '#FFF4EC', '#F3EBFF'],
    darkColors: ['#261320', '#241826', '#17162B'],
    preview: ['#FFD1E0', '#FFE3CC'],
  },
  {
    id: 'forest',
    name: '森林晨光',
    lightColors: ['#E3F6EE', '#F1FBF6', '#E7F3F8'],
    darkColors: ['#0E221C', '#112523', '#101E28'],
    preview: ['#BFEAD7', '#C8E9F2'],
  },
  {
    id: 'midnight',
    name: '极夜星河',
    lightColors: ['#E3E8FF', '#EFE9FF', '#E2F2FF'],
    darkColors: ['#0B0F1F', '#161635', '#0D2137'],
    preview: ['#3B4380', '#182B4D'],
  },
];
