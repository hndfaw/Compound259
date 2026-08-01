import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Defs, LinearGradient, Line, Path, Stop } from 'react-native-svg';

import { withAlpha } from '@/constants/tokens';
import { useTheme } from '@/hooks/use-theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Comfortably longer than any path this 320x150 viewBox can produce, so the
// line starts fully hidden and then "draws" itself in.
const DASH = 900;

/**
 * Projected-growth line chart with area fill and gridlines. The viewBox is
 * 320x150 squashed into `height`, matching the design's
 * `preserveAspectRatio="none"`. The draw-in runs once per mount (`cc-drawline`
 * / `cc-rise`).
 */
export function GrowthChart({ line, area, height = 84 }: { line: string; area: string; height?: number }) {
  const { theme } = useTheme();
  const stroke = theme.chartStroke;
  const strokeIsGradient = stroke.length > 1;

  const draw = useRef(new Animated.Value(DASH)).current;
  const rise = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.parallel([
      Animated.timing(draw, {
        toValue: 0,
        duration: 1400,
        delay: 200,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false,
      }),
      Animated.timing(rise, {
        toValue: 1,
        duration: 1000,
        delay: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [draw, rise]);

  return (
    <Svg width="100%" height={height} viewBox="0 0 320 150" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="chartLine" x1="0" y1="0" x2="1" y2="0">
          {stroke.map((c, i) => (
            <Stop key={c + i} offset={`${i / Math.max(1, stroke.length - 1)}`} stopColor={c} />
          ))}
        </LinearGradient>
        <LinearGradient id="chartArea" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={theme.chartArea} stopOpacity={theme.chartAreaOpacity} />
          <Stop offset="1" stopColor={theme.chartArea} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Line x1="0" y1="149" x2="320" y2="149" stroke={theme.track} strokeWidth={1} />
      <Line x1="0" y1="96" x2="320" y2="96" stroke={theme.track} strokeWidth={1} strokeDasharray="3 5" />
      <Line x1="0" y1="48" x2="320" y2="48" stroke={theme.track} strokeWidth={1} strokeDasharray="3 5" />
      <AnimatedPath d={area} fill="url(#chartArea)" opacity={rise} />
      <AnimatedPath
        d={line}
        fill="none"
        stroke={strokeIsGradient ? 'url(#chartLine)' : stroke[0]}
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={DASH}
        strokeDashoffset={draw}
      />
    </Svg>
  );
}

export { withAlpha };
