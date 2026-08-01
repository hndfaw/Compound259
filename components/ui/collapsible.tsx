import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, LayoutChangeEvent, StyleProp, View, ViewStyle } from 'react-native';

const EASE = Easing.bezier(0.32, 0.72, 0, 1);

/**
 * Height/opacity collapse used by the calculator when the keypad takes over the
 * screen (the redesign's `max-height` + `opacity` + `translateY` transitions).
 *
 * The natural height is measured from the content rather than hard-coded, so a
 * longer label or a larger accessibility text size can never clip.
 */
export function Collapsible({
  expanded,
  children,
  rise = 0,
  duration = 460,
  bleed = 0,
  style,
}: {
  expanded: boolean;
  children: React.ReactNode;
  /** Pixels the content slides up by while collapsed (design uses -12 to -22). */
  rise?: number;
  duration?: number;
  /**
   * Room for children's drop shadows, which `overflow: hidden` would otherwise
   * clip. Padded inside (so it counts toward the measured height) and pulled
   * back out with negative margins, matching the spec's
   * `padding: 0 18px 18px; margin: 0 -18px -18px`.
   */
  bleed?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const [height, setHeight] = useState<number | null>(null);
  const t = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  // Skip the very first animation so a screen that mounts collapsed does not
  // visibly fold up in front of the user.
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      t.setValue(expanded ? 1 : 0);
      return;
    }
    const anim = Animated.timing(t, {
      toValue: expanded ? 1 : 0,
      duration,
      easing: EASE,
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [expanded, duration, t]);

  const onLayout = (e: LayoutChangeEvent) => {
    const next = Math.round(e.nativeEvent.layout.height);
    if (next > 0 && next !== height) setHeight(next);
  };

  return (
    <Animated.View
      style={[
        style,
        {
          overflow: 'hidden',
          marginHorizontal: -bleed,
          marginBottom: -bleed,
          opacity: t,
          // Before the first measurement the content renders at its natural
          // height; afterwards the height is driven by the animation.
          ...(height == null ? null : { height: t.interpolate({ inputRange: [0, 1], outputRange: [0, height] }) }),
        },
      ]}
      pointerEvents={expanded ? 'auto' : 'none'}
      needsOffscreenAlphaCompositing
    >
      <Animated.View
        style={{
          transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [rise, 0] }) }],
        }}
      >
        <View onLayout={onLayout} style={{ paddingHorizontal: bleed, paddingBottom: bleed }}>
          {children}
        </View>
      </Animated.View>
    </Animated.View>
  );
}
