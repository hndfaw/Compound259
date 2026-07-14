import React from 'react';
import Svg, { Defs, LinearGradient, Line, Path, Stop } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/constants/tokens';

/** Projected-growth line chart with area fill and gridlines (viewBox 320x150). */
export function GrowthChart({ line, area }: { line: string; area: string }) {
  const { theme } = useTheme();
  const stroke = theme.chartStroke;
  const strokeIsGradient = stroke.length > 1;

  return (
    <Svg width="100%" height={140} viewBox="0 0 320 150" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="chartLine" x1="0" y1="0" x2="1" y2="0">
          {stroke.map((c, i) => (
            <Stop key={i} offset={`${i / Math.max(1, stroke.length - 1)}`} stopColor={c} />
          ))}
        </LinearGradient>
        <LinearGradient id="chartArea" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={theme.chartArea} stopOpacity={theme.chartAreaOpacity} />
          <Stop offset="1" stopColor={theme.chartArea} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Line x1="0" y1="140" x2="320" y2="140" stroke={theme.track} strokeWidth={1} />
      <Line x1="0" y1="90" x2="320" y2="90" stroke={theme.track} strokeWidth={1} strokeDasharray="3 5" />
      <Line x1="0" y1="45" x2="320" y2="45" stroke={theme.track} strokeWidth={1} strokeDasharray="3 5" />
      <Path d={area} fill="url(#chartArea)" />
      <Path
        d={line}
        fill="none"
        stroke={strokeIsGradient ? 'url(#chartLine)' : stroke[0]}
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export { withAlpha };
