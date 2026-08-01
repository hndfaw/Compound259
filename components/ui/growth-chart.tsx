import React, { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Line, Path, Stop } from 'react-native-svg';

import { withAlpha } from '@/constants/tokens';
import { useTheme } from '@/hooks/use-theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Comfortably longer than any path this 320x150 viewBox can produce. */
const DASH = 900;
/** How long the curve takes to settle into a new shape. */
const MORPH_MS = 520;

export type ChartPoint = [number, number];

/** Straight lerp between two equal-length series; falls back to the target. */
function tween(from: ChartPoint[], to: ChartPoint[], t: number): ChartPoint[] {
  'worklet';
  if (from.length !== to.length) return to;
  const out: ChartPoint[] = [];
  for (let i = 0; i < to.length; i++) {
    out.push([from[i][0] + (to[i][0] - from[i][0]) * t, from[i][1] + (to[i][1] - from[i][1]) * t]);
  }
  return out;
}

/** Catmull-Rom -> cubic Bézier, matching utils/finance's smoothPath. */
function buildLine(p: ChartPoint[]): string {
  'worklet';
  if (!p.length) return '';
  let d = `M ${p[0][0]} ${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] || p[i + 1];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

/**
 * Projected-growth line chart with area fill and gridlines. The viewBox is
 * 320x150 squashed into `height`, matching the design's
 * `preserveAspectRatio="none"`.
 *
 * The curve is tweened point-by-point on the UI thread whenever the
 * assumptions change, so editing a value glides the line to its new shape
 * instead of snapping. The one-off draw-in still runs on mount.
 */
export function GrowthChart({ points, height = 84 }: { points: ChartPoint[]; height?: number }) {
  const { theme } = useTheme();
  const stroke = theme.chartStroke;
  const strokeIsGradient = stroke.length > 1;

  const from = useSharedValue<ChartPoint[]>(points);
  const to = useSharedValue<ChartPoint[]>(points);
  const progress = useSharedValue(1);
  const dash = useSharedValue(DASH);
  const rise = useSharedValue(0);

  // One-off draw-in (`cc-drawline` / `cc-rise`).
  useEffect(() => {
    dash.value = withDelay(200, withTiming(0, { duration: 1400, easing: Easing.bezier(0.4, 0, 0.2, 1) }));
    rise.value = withDelay(400, withTiming(1, { duration: 1000, easing: Easing.out(Easing.ease) }));
  }, [dash, rise]);

  // Re-target whenever the series changes, starting from wherever the curve
  // currently sits so rapid edits chain smoothly instead of jumping back.
  useEffect(() => {
    from.value = tween(from.value, to.value, progress.value);
    to.value = points;
    progress.value = 0;
    progress.value = withTiming(1, { duration: MORPH_MS, easing: Easing.out(Easing.cubic) });
  }, [points, from, to, progress]);

  const lineProps = useAnimatedProps(() => ({
    d: buildLine(tween(from.value, to.value, progress.value)),
    strokeDashoffset: dash.value,
  }));

  const areaProps = useAnimatedProps(() => ({
    d: `${buildLine(tween(from.value, to.value, progress.value))} L 312 150 L 8 150 Z`,
    opacity: rise.value,
  }));

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
      <AnimatedPath animatedProps={areaProps} fill="url(#chartArea)" />
      <AnimatedPath
        animatedProps={lineProps}
        fill="none"
        stroke={strokeIsGradient ? 'url(#chartLine)' : stroke[0]}
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={DASH}
      />
    </Svg>
  );
}

export { withAlpha };
