/**
 * App design tokens — the single source of truth for the dark UI palette.
 *
 * Every value here is the exact color already used across the app, now named
 * semantically. New/refactored components reference these instead of inline
 * hex, so a redesign can retheme the whole app by editing this one file.
 *
 * (constants/theme.ts remains the Expo-template light/dark map used by the
 * React Navigation theme + ThemedText; this file is the app's own palette.)
 */

export const AppColors = {
  // Backgrounds & surfaces
  background: '#030712', // app background (deepest)
  surface: '#111827', // cards
  surfaceInset: '#0F172A', // inputs / inset rows
  surfaceRaised: '#1F2937', // modals, sheets, elevated chips
  surfaceAccent: '#065F46', // deep-green balance panel

  // Borders
  border: '#374151',
  borderSubtle: '#1F2937',

  // Brand / accent
  accent: '#10B981',
  accentBright: '#34D399',

  // Text tiers
  white: '#FFFFFF',
  textPrimary: '#F9FAFB',
  textSecondary: '#E5E7EB',
  textMuted: '#9CA3AF',
  textDim: '#6B7280',
  textFaint: '#4B5563',

  // Data / semantic accents
  principal: '#60A5FA', // blue
  contribution: '#F59E0B', // amber
  interest: '#34D399', // green (matches accentBright)
  danger: '#EF4444',
  dangerBright: '#F87171',
  info: '#3B82F6',
  pink: '#F472B6',
  black: '#000000',
} as const;

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
