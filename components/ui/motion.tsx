import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, ViewStyle } from 'react-native';

/**
 * Entrance animations lifted from the redesign's CSS keyframes so screens feel
 * the same as the prototype. All of these run once, when the element mounts.
 */

const EASE_OUT = Easing.out(Easing.ease);
const SPRINGY = Easing.bezier(0.22, 1, 0.3, 1);

/** `cc-fadeup` — opacity 0 -> 1 with a 14px rise. */
export function FadeUp({
  children,
  delay = 0,
  duration = 500,
  distance = 14,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(t, {
      toValue: 1,
      duration,
      delay,
      easing: EASE_OUT,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [t, delay, duration]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: t,
          transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** `cc-pop` — opacity 0 -> 1 with a small rise and scale-up. */
export function Pop({
  children,
  delay = 0,
  duration = 340,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(t, {
      toValue: 1,
      duration,
      delay,
      easing: SPRINGY,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [t, delay, duration]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: t,
          transform: [
            { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [9, 0] }) },
            { scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.93, 1] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** `cc-screen` — the whole screen body eases in on entry. */
export function ScreenEnter({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(t, {
      toValue: 1,
      duration: 440,
      easing: SPRINGY,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [t]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: t,
          transform: [
            { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
            { scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.985, 1] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
