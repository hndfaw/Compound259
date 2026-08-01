/**
 * App design tokens — the single source of truth for the UI.
 *
 * Values are a direct translation of the CSS custom properties in the
 * Compound259 redesign spec (`:root/[data-theme="dark"]` and
 * `[data-theme="light"]`). Components read the active theme via `useTheme()`
 * and never hard-code colors, so retheming happens here.
 */

/** Convert a 6-digit hex to an rgba() string with the given alpha. */
export const withAlpha = (hex: string, alpha: number): string => {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return `rgba(0,0,0,${alpha})`;
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/** Font families loaded in the root layout (Manrope body, Space Grotesk display). */
export const Font = {
  body: 'Manrope_500Medium',
  bodySemi: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
  bodyBlack: 'Manrope_800ExtraBold',
  displayMed: 'SpaceGrotesk_500Medium',
  display: 'SpaceGrotesk_600SemiBold',
  displayBold: 'SpaceGrotesk_700Bold',
} as const;

export type ThemeMode = 'dark' | 'light';

export type Theme = {
  mode: ThemeMode;
  /** Tint passed to the BlurView behind glass surfaces. */
  blurTint: 'dark' | 'light';

  // Backgrounds — `--bg`, `--blob`
  bg: string;
  blobOpacity: number;
  blobs: readonly [string, string, string];

  // Text — `--text`, `--sub`, `--ter`
  text: string;
  sub: string;
  ter: string;

  // Cards — `--card`, `--card-bd`, `--card-shadow`
  card: string;
  cardBorder: string;
  cardShadow: string;

  // Accent — `--accent`, `--accent-soft`, `--accent-bd`
  accent: string;
  accentSoft: string;
  accentBorder: string;

  // Primary button / balance — `--btn-grad`, `--btn-fg`, `--btn-shadow`, `--balance-bg`
  btnGrad: readonly string[]; // one entry = solid (no gradient)
  btnFg: string;
  btnShadow: string;
  balanceGrad: readonly string[]; // one entry = solid (no gradient)

  // Chart — `--chart-stroke`, `--area-fill`, `--dot`
  chartStroke: readonly string[]; // one entry = solid stroke
  chartArea: string; // top color of the area fill (fades to transparent)
  chartAreaOpacity: number;
  dot: string;

  // Data segments — `--c-principal`, `--c-contrib`, `--c-interest`, `--track`
  cPrincipal: string;
  cContrib: string;
  cInterest: string;
  track: string;

  // Muted controls — `--muted-bg`, `--muted-bd`, `--muted-col`
  mutedBg: string;
  mutedBorder: string;
  mutedCol: string;

  // Danger — `--danger`, `--danger-bg`, `--danger-bd`
  danger: string;
  dangerBg: string;
  dangerBorder: string;

  // Chips (off state) — `--chip-off-bd`, `--chip-off-col`
  chipOffBorder: string;
  chipOffCol: string;

  // Overlays / sheets — `--overlay`, `--sheet`, `--sheet-bd`
  overlay: string;
  sheet: string;
  sheetBorder: string;

  // Tab bar glass — `--glass-tint`, `--glass-bd`, `--glass-shine`, `--bar-shadow`
  glassTint: string;
  glassBorder: string;
  glassShine: string;
  barShadow: string;

  // Active tab pill — `--pill-bg`, `--pill-bd`, `--pill-shine`
  pillGrad: readonly string[]; // one entry = solid (no gradient)
  pillBorder: string;
  /** Undefined where the spec says `none`; a literal "none" is not a valid RN shadow. */
  pillShine?: string;

  // Icons — `--tab-icon`, `--icon-tile`, `--icon-tile-bd`
  tabIcon: string;
  iconTile: string;
  iconTileBorder: string;

  // Keypad shell — `--keypad-bg`, `--keypad-bd`, `--keypad-shadow`
  keypadBg: string;
  keypadBorder: string;
  keypadShadow: string;

  // Keypad mini-tile rail / grabber — `--rail-bg`, `--rail-bd`, `--grabber`
  railBg: string;
  railBorder: string;
  grabber: string;

  // Keys — `--key-bg`, `--key-fg`, `--key-util`, `--key-util-fg`, `--key-green`, `--key-dim`
  keyBg: string;
  keyFg: string;
  /** Undefined in Aurora, where the spec's keys are flat. */
  keyShadow?: string;
  keyUtil: string;
  keyUtilFg: string;
  keyGreen: string;
  keyDim: string;
};

export const darkTheme: Theme = {
  mode: 'dark',
  blurTint: 'dark',

  bg: '#07060D',
  blobOpacity: 0.13,
  blobs: ['#7CF6B0', '#37D9F5', '#9A7CFF'],

  text: '#F1F4FC',
  sub: '#9AA2C0',
  ter: '#8890B0',

  card: 'rgba(255,255,255,0.075)',
  cardBorder: 'rgba(255,255,255,0.16)',
  cardShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 10px 26px rgba(0,0,0,0.4)',

  accent: '#8DF7C6',
  accentSoft: 'rgba(124,246,208,0.14)',
  accentBorder: 'rgba(124,246,208,0.32)',

  btnGrad: ['#B9FF8F', '#7CF6B0', '#37F5D2'],
  btnFg: '#04140D',
  btnShadow: '0 12px 30px rgba(55,245,210,0.32)',
  balanceGrad: ['#B9FF8F', '#7CF6B0', '#37F5D2'],

  chartStroke: ['#B9FF8F', '#7CF6B0', '#37F5D2'],
  chartArea: '#7CF6B0',
  chartAreaOpacity: 0.4,
  dot: '#B9FF8F',

  cPrincipal: '#6FA8FF',
  cContrib: '#9A7CFF',
  cInterest: '#7CF6B0',
  track: 'rgba(255,255,255,0.08)',

  mutedBg: 'rgba(255,255,255,0.075)',
  mutedBorder: 'rgba(255,255,255,0.16)',
  mutedCol: '#AEB5D0',

  danger: '#F79797',
  dangerBg: 'rgba(248,113,113,0.12)',
  dangerBorder: 'rgba(248,113,113,0.28)',

  chipOffBorder: 'rgba(255,255,255,0.12)',
  chipOffCol: '#9AA2C0',

  overlay: 'rgba(0,0,0,0.62)',
  sheet: '#11151F',
  sheetBorder: 'rgba(255,255,255,0.08)',

  glassTint: 'rgba(255,255,255,0.08)',
  glassBorder: 'rgba(255,255,255,0.14)',
  glassShine: 'inset 1.5px 1.5px 1px rgba(255,255,255,0.16), inset -1px -1px 1px rgba(255,255,255,0.06)',
  barShadow: '0 2px 10px rgba(0,0,0,0.45), 0 14px 36px rgba(0,0,0,0.5)',

  pillGrad: ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.06)'],
  pillBorder: 'rgba(255,255,255,0.2)',
  pillShine:
    'inset 1.5px 1.5px 1px rgba(255,255,255,0.24), inset -1px -1px 1px rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.4)',

  tabIcon: '#8890B0',
  iconTile: 'rgba(124,246,208,0.14)',
  iconTileBorder: 'rgba(124,246,208,0.3)',

  keypadBg: '#0E1017',
  keypadBorder: 'rgba(255,255,255,0.08)',
  keypadShadow: '0 -14px 44px rgba(0,0,0,0.5)',

  railBg: 'rgba(255,255,255,0.055)',
  railBorder: 'rgba(255,255,255,0.14)',
  grabber: 'rgba(255,255,255,0.22)',

  keyBg: '#262A35',
  keyFg: '#FFFFFF',
  keyShadow: undefined,
  keyUtil: '#4A505E',
  keyUtilFg: '#FFFFFF',
  keyGreen: '#12B981',
  keyDim: 'rgba(255,255,255,0.34)',
};

export const lightTheme: Theme = {
  mode: 'light',
  blurTint: 'light',

  bg: '#F9F9F7',
  blobOpacity: 0,
  blobs: ['#7CF6B0', '#37D9F5', '#9A7CFF'],

  text: '#1C1C1E',
  sub: '#65656A',
  ter: '#79797F',

  card: '#FFFFFF',
  cardBorder: 'rgba(0,0,0,0.03)',
  cardShadow: '0 1px 3px rgba(0,0,0,0.045), 0 5px 13px rgba(0,0,0,0.05)',

  accent: '#157F45',
  accentSoft: 'rgba(30,158,87,0.12)',
  accentBorder: 'rgba(30,158,87,0.26)',

  btnGrad: ['#1E9E57'],
  btnFg: '#FFFFFF',
  btnShadow: '0 6px 16px rgba(30,158,87,0.24)',
  balanceGrad: ['#1C1C1E'],

  chartStroke: ['#1E9E57'],
  chartArea: '#1E9E57',
  chartAreaOpacity: 0.2,
  dot: '#1E9E57',

  cPrincipal: '#0A84FF',
  cContrib: '#9B51E0',
  cInterest: '#1E9E57',
  track: '#E5E5EA',

  mutedBg: '#F2F2F7',
  mutedBorder: '#E5E5EA',
  mutedCol: '#3C3C43',

  danger: '#FF3B30',
  dangerBg: 'rgba(255,59,48,0.1)',
  dangerBorder: 'rgba(255,59,48,0.24)',

  chipOffBorder: '#E5E5EA',
  chipOffCol: '#65656A',

  overlay: 'rgba(0,0,0,0.34)',
  sheet: '#FFFFFF',
  sheetBorder: '#E5E5EA',

  glassTint: 'rgba(255,255,255,0.5)',
  glassBorder: 'rgba(0,0,0,0.08)',
  glassShine: 'inset 1.5px 1.5px 1px rgba(255,255,255,0.9), inset -1px -1px 1px rgba(255,255,255,0.55)',
  barShadow: '0 10px 30px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.06)',

  pillGrad: ['rgba(30,158,87,0.13)'],
  pillBorder: 'rgba(30,158,87,0.2)',
  pillShine: undefined,

  tabIcon: '#76767C',
  iconTile: 'rgba(30,158,87,0.12)',
  iconTileBorder: 'rgba(30,158,87,0.26)',

  keypadBg: '#D1D5DB',
  keypadBorder: 'rgba(0,0,0,0.1)',
  keypadShadow: '0 -12px 34px rgba(0,0,0,0.16)',

  railBg: '#FFFFFF',
  railBorder: 'rgba(0,0,0,0.07)',
  grabber: 'rgba(0,0,0,0.26)',

  keyBg: '#FFFFFF',
  keyFg: '#1C1C1E',
  keyShadow: '0 1px 0 rgba(0,0,0,0.26)',
  keyUtil: '#AEB4BF',
  keyUtilFg: '#1C1C1E',
  keyGreen: '#1E9E57',
  keyDim: 'rgba(28,28,30,0.34)',
};

export const themes: Record<ThemeMode, Theme> = {
  dark: darkTheme,
  light: lightTheme,
};
