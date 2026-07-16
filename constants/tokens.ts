/**
 * App design tokens — the single source of truth for the UI.
 *
 * Two themes (Aurora / dark, Daylight / light) translated from the Compound259
 * redesign spec. Components read the active theme via `useTheme()` and never
 * hard-code colors, so retheming happens here.
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
  // Backgrounds
  bg: string;
  bgGradient?: readonly [string, string];
  blobOpacity: number;
  blobs: readonly [string, string, string];
  // Text
  text: string;
  sub: string;
  ter: string;
  // Cards / surfaces
  card: string;
  cardBorder: string;
  cardShadow: boolean;
  // Accent
  accent: string;
  accentSoft: string;
  accentBorder: string;
  // Gradient button / balance
  btnGrad: readonly string[];
  btnFg: string;
  balanceGrad: readonly string[]; // one entry = solid (no gradient)
  // Chart
  chartStroke: readonly string[]; // one entry = solid stroke
  chartArea: string; // top color of the area fill (fades to transparent)
  chartAreaOpacity: number;
  dot: string;
  // Data segments
  cPrincipal: string;
  cContrib: string;
  cInterest: string;
  track: string;
  // Muted controls
  mutedBg: string;
  mutedBorder: string;
  mutedCol: string;
  // Danger
  danger: string;
  dangerBg: string;
  dangerBorder: string;
  // Chips (off state)
  chipOffBorder: string;
  chipOffCol: string;
  // Overlays / sheets
  overlay: string;
  sheet: string;
  sheetBorder: string;
  // Tab bar / glass
  glassTint: string;
  glassBorder: string;
  tabIcon: string;
  iconTile: string;
  iconTileBorder: string;
};

export const darkTheme: Theme = {
  mode: 'dark',
  bg: '#07060D',
  blobOpacity: 0.2,
  blobs: ['#7CF6B0', '#37D9F5', '#9A7CFF'],
  text: '#F1F4FC',
  sub: '#9AA2C0',
  ter: '#8890B0',
  card: 'rgba(255,255,255,0.045)',
  cardBorder: 'rgba(255,255,255,0.10)',
  cardShadow: false,
  accent: '#8DF7C6',
  accentSoft: 'rgba(124,246,208,0.14)',
  accentBorder: 'rgba(124,246,208,0.32)',
  btnGrad: ['#B9FF8F', '#7CF6B0', '#37F5D2'],
  btnFg: '#04140D',
  balanceGrad: ['#B9FF8F', '#7CF6B0', '#37F5D2'],
  chartStroke: ['#B9FF8F', '#7CF6B0', '#37F5D2'],
  chartArea: '#7CF6B0',
  chartAreaOpacity: 0.4,
  dot: '#B9FF8F',
  cPrincipal: '#6FA8FF',
  cContrib: '#9A7CFF',
  cInterest: '#7CF6B0',
  track: 'rgba(255,255,255,0.08)',
  mutedBg: 'rgba(255,255,255,0.05)',
  mutedBorder: 'rgba(255,255,255,0.12)',
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
  tabIcon: '#8890B0',
  iconTile: 'rgba(124,246,208,0.14)',
  iconTileBorder: 'rgba(124,246,208,0.3)',
};

export const lightTheme: Theme = {
  mode: 'light',
  bg: '#F4F6EF',
  bgGradient: ['#FBFBF8', '#F1F3EC'],
  blobOpacity: 0,
  blobs: ['#7CF6B0', '#37D9F5', '#9A7CFF'],
  text: '#12211B',
  sub: '#5C6B62',
  ter: '#8A968C',
  card: '#FFFFFF',
  cardBorder: '#EAEBE3',
  cardShadow: true,
  accent: '#0B8D57',
  accentSoft: 'rgba(15,169,104,0.12)',
  accentBorder: 'rgba(15,169,104,0.28)',
  btnGrad: ['#12B76A', '#0B8D57'],
  btnFg: '#FFFFFF',
  balanceGrad: ['#12211B'],
  chartStroke: ['#12B76A'],
  chartArea: '#12B76A',
  chartAreaOpacity: 0.22,
  dot: '#0FA968',
  cPrincipal: '#2E77E6',
  cContrib: '#7A5CF0',
  cInterest: '#12B76A',
  track: '#ECEEE8',
  mutedBg: '#F4F6F0',
  mutedBorder: '#E7E9E2',
  mutedCol: '#4C5A50',
  danger: '#D64545',
  dangerBg: 'rgba(239,68,68,0.08)',
  dangerBorder: 'rgba(239,68,68,0.2)',
  chipOffBorder: '#E2E5DC',
  chipOffCol: '#6D7A70',
  overlay: 'rgba(20,30,25,0.4)',
  sheet: '#FFFFFF',
  sheetBorder: '#EAEBE3',
  glassTint: 'rgba(255,255,255,0.5)',
  glassBorder: 'rgba(0,0,0,0.06)',
  tabIcon: '#8A968C',
  iconTile: 'rgba(15,169,104,0.12)',
  iconTileBorder: 'rgba(15,169,104,0.3)',
};

export const themes: Record<ThemeMode, Theme> = {
  dark: darkTheme,
  light: lightTheme,
};
