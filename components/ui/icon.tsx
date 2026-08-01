import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

// Icon paths lifted from the redesign spec. Most render as strokes; a few
// (moon, filled bookmark, filled trending, apple) render as fills.
const STROKE_ICONS = {
  trending: 'M4 18L11 10l4 4 6-8',
  bookmark: 'M6 4h12a1 1 0 011 1v15l-7-4-7 4V5a1 1 0 011-1z',
  book: 'M12 6.5c-1.7-1-4.2-1.6-6-1.6v12.6c1.8 0 4.3.6 6 1.6 1.7-1 4.2-1.6 6-1.6V4.9c-1.8 0-4.3.6-6 1.6zm0 0v12.6',
  chevronDown: 'M6 9l6 6 6-6',
  chevronUp: 'M18 15l-6-6-6 6',
  chevronRight: 'M9 6l6 6-6 6',
  plus: 'M12 5v14M5 12h14',
  minus: 'M6 12h12',
  share: 'M12 15V3m0 0L8 7m4-4l4 4M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6',
  edit: 'M4 20h4L18 10l-4-4L4 16v4zM14 6l4 4',
  trash: 'M5 7h14M9 7V5h6v2M6 7l1 13h10l1-13',
  heart: 'M12 21s-7-4.5-9.5-9C1 9 2.5 5.5 6 5.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.5 0 5 3.5 3.5 6.5C19 16.5 12 21 12 21z',
  check: 'M5 13l4 4L19 7',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 00-4 10.5c.7.7 1 1.2 1 2.5h6c0-1.3.3-1.8 1-2.5A6 6 0 0012 3z',
} as const;

const FILL_ICONS = {
  moon: 'M21 12.8A8.5 8.5 0 1111.2 3a6.5 6.5 0 009.8 9.8z',
  bookmark: 'M6 4h12a1 1 0 011 1v15l-7-4-7 4V5a1 1 0 011-1z',
  trending: 'M4 18L11 10l4 4 6-8',
} as const;

export type IconName = keyof typeof STROKE_ICONS | 'moon' | 'sun' | 'apple' | 'brand' | 'backspace';

type IconProps = {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
  /** Render the fill-only variant (moon, saved bookmark on the save button). */
  filled?: boolean;
  /** Fill colour painted *under* the stroke (the active Saved tab icon). */
  fill?: string;
};

export function Icon({ name, size = 20, color, strokeWidth = 2, filled = false, fill }: IconProps) {
  if (name === 'sun') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={4.2} fill={color} />
        <Path
          d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5 5l1.6 1.6M17.4 17.4L19 19M19 5l-1.6 1.6M6.6 17.4L5 19"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      </Svg>
    );
  }

  // Apple wordmark glyph for the share card's App Store badge.
  if (name === 'apple') {
    return (
      <Svg width={size * (11 / 13)} height={size} viewBox="0 0 24 28" fill={color}>
        <Path d="M17 14c0-3 2.5-4.5 2.6-4.6-1.4-2-3.6-2.3-4.4-2.3-1.9-.2-3.6 1.1-4.6 1.1s-2.4-1.1-4-1c-2 0-3.9 1.2-5 3-2.1 3.7-.5 9.2 1.5 12.2 1 1.5 2.2 3.1 3.7 3 1.5-.1 2-1 3.8-1s2.3 1 3.9.9c1.6 0 2.6-1.5 3.6-3 1.1-1.7 1.6-3.4 1.6-3.5-.1 0-3.1-1.2-3.1-4.8zM14 5.3c.8-1 1.4-2.4 1.2-3.8-1.2 0-2.6.8-3.5 1.8-.8.9-1.5 2.3-1.3 3.6 1.3.1 2.7-.7 3.6-1.6z" />
      </Svg>
    );
  }

  // Compound259 chart mark used in the share card footer.
  if (name === 'brand') {
    return (
      <Svg width={size} height={size * 0.6} viewBox="0 0 100 60" fill="none">
        <Path d="M8 50 L34 34 L54 40 L92 8" stroke={color} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }

  // Keypad delete key.
  if (name === 'backspace') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M9 5h10a2 2 0 012 2v10a2 2 0 01-2 2H9L2.6 12 9 5z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
        <Path d="M12.4 9.6l4.2 4.8M16.6 9.6l-4.2 4.8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      </Svg>
    );
  }

  if (name === 'moon') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d={FILL_ICONS.moon} fill={color} />
      </Svg>
    );
  }

  if (filled && name in FILL_ICONS) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d={FILL_ICONS[name as keyof typeof FILL_ICONS]} fill={color} />
      </Svg>
    );
  }

  const d = STROKE_ICONS[name as keyof typeof STROKE_ICONS];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill ?? 'none'}>
      <Path d={d} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
