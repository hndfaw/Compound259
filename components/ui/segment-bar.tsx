import React, { useEffect, useRef } from 'react';
import { Animated, Easing, DimensionValue, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

const EASE = Easing.bezier(0.4, 0, 0.2, 1);

/** One `cc-growx` segment: wipes in from its left edge after `delay`. */
function Segment({
  color,
  width,
  flex,
  delay,
}: {
  color: string;
  width?: DimensionValue;
  flex?: number;
  delay: number;
}) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(t, { toValue: 1, duration: 800, delay, easing: EASE, useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [t, delay]);

  return (
    <Animated.View
      style={{
        width,
        flex,
        backgroundColor: color,
        transformOrigin: 'left center',
        transform: [{ scaleX: t }],
      }}
    />
  );
}

/** Three-segment principal / contributions / interest progress bar. */
export function SegmentBar({
  principalPct,
  contribPct,
}: {
  principalPct: number; // 0-100
  contribPct: number; // 0-100
}) {
  const { theme } = useTheme();
  return (
    <View style={{ height: 9, borderRadius: 6, overflow: 'hidden', flexDirection: 'row', backgroundColor: theme.track }}>
      <Segment color={theme.cPrincipal} width={`${+principalPct.toFixed(2)}%`} delay={500} />
      <Segment color={theme.cContrib} width={`${+contribPct.toFixed(2)}%`} delay={620} />
      <Segment color={theme.cInterest} flex={1} delay={740} />
    </View>
  );
}
