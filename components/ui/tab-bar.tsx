import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Font, Theme } from '@/constants/tokens';
import { useSaveAction } from '@/hooks/use-save-action';
import { useTheme } from '@/hooks/use-theme';
import { Icon, IconName } from './icon';
import { TAB_BAR_INSET } from './screen';

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Calculator', icon: 'trending' },
  explore: { label: 'Saved', icon: 'bookmark' },
  learn: { label: 'Learn', icon: 'book' },
};

const SPRINGY = Easing.bezier(0.34, 1.24, 0.42, 1);
const ACTION_SIZE = 55;
const ACTION_GAP = 9;

/** Blur + tint + shine stack shared by the capsule and the save button. */
function Glass({ theme, radius }: { theme: Theme; radius: number }) {
  return (
    <>
      <BlurView
        intensity={40}
        tint={theme.blurTint}
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
      />
      <View style={[StyleSheet.absoluteFill, { borderRadius: radius, backgroundColor: theme.glassTint }]} />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: radius, borderWidth: 0.5, borderColor: theme.glassBorder, boxShadow: theme.glassShine },
        ]}
      />
    </>
  );
}

/** Floating glass tab bar with a sliding pill and the save-scenario action. */
export function GlassTabBar({ state, navigation }: BottomTabBarProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { request } = useSaveAction();

  const routes = state.routes.filter((r) => TABS[r.name]);
  // Index into the rendered list, not into a hard-coded order: the navigator's
  // route order is its own business, and a name we don't recognise must not
  // silently resolve to 0 and yank the pill back to the first tab.
  const activeKey = state.routes[state.index]?.key;
  const activeIndex = Math.max(0, routes.findIndex((r) => r.key === activeKey));
  const onCalc = routes[activeIndex]?.name === 'index';
  const count = Math.max(1, routes.length);

  const slide = useRef(new Animated.Value(activeIndex)).current;
  const action = useRef(new Animated.Value(onCalc ? 1 : 0)).current;

  useEffect(() => {
    const anim = Animated.timing(slide, {
      toValue: activeIndex,
      duration: 500,
      easing: SPRINGY,
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [activeIndex, slide]);

  useEffect(() => {
    const anim = Animated.timing(action, {
      toValue: onCalc ? 1 : 0,
      duration: 480,
      easing: Easing.bezier(0.34, 1.2, 0.44, 1),
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [onCalc, action]);

  return (
    <View
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: Math.max(TAB_BAR_INSET, insets.bottom),
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View style={{ flex: 1, minWidth: 0, padding: 4, borderRadius: 999, overflow: 'hidden', boxShadow: theme.barShadow }}>
        <Glass theme={theme} radius={999} />
        {/* Positioned above the glass stack, matching the spec's `z-index: 1`. */}
        <View style={{ flexDirection: 'row', flex: 1, position: 'relative', zIndex: 1 }}>
          {/*
           * Positioned in percentages rather than measured pixels. Measuring
           * meant an onLayout -> setState on every frame that the save button
           * collapsed (it resizes this capsule), which re-rendered the bar ~30
           * times mid-transition and rewrote the pill's own target as it moved.
           * Percentages track the capsule's width for free.
           */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: `${100 / count}%`,
              left: slide.interpolate({
                inputRange: [0, Math.max(1, count - 1)],
                outputRange: ['0%', `${((count - 1) * 100) / count}%`],
              }),
              borderRadius: 999,
              overflow: 'hidden',
              borderWidth: 0.5,
              borderColor: theme.pillBorder,
              boxShadow: theme.pillShine,
            }}
          >
            <LinearGradient
              colors={
                (theme.pillGrad.length > 1
                  ? theme.pillGrad
                  : [theme.pillGrad[0], theme.pillGrad[0]]) as [string, string, ...string[]]
              }
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          {routes.map((route) => {
            const config = TABS[route.name];
            const focused = route.key === activeKey;
            const color = focused ? theme.accent : theme.tabIcon;

            const onPress = () => {
              if (Platform.OS === 'ios') Haptics.selectionAsync();
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={focused ? { selected: true } : {}}
                accessibilityLabel={config.label}
                style={{
                  flex: 1,
                  borderRadius: 999,
                  paddingTop: 6,
                  paddingBottom: 7,
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    alignItems: 'center',
                    gap: 2,
                    transform: [{ translateY: focused ? -1 : 0 }],
                  }}
                >
                  <Icon
                    name={config.icon}
                    size={19}
                    color={color}
                    strokeWidth={2}
                    fill={focused && route.name === 'explore' ? theme.accent : undefined}
                  />
                  <Text style={{ fontFamily: Font.bodyBold, fontSize: 9.5, letterSpacing: 0.1, color }}>
                    {config.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <Animated.View
        style={{
          width: action.interpolate({ inputRange: [0, 1], outputRange: [0, ACTION_SIZE] }),
          marginLeft: action.interpolate({ inputRange: [0, 1], outputRange: [0, ACTION_GAP] }),
          height: ACTION_SIZE,
          flexShrink: 0,
          borderRadius: 999,
          overflow: 'hidden',
          opacity: action,
          transform: [{ scale: action.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
          boxShadow: theme.barShadow,
        }}
        pointerEvents={onCalc ? 'auto' : 'none'}
      >
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS === 'ios') Haptics.selectionAsync();
            request();
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Save this scenario"
          style={{ width: ACTION_SIZE, height: ACTION_SIZE, alignItems: 'center', justifyContent: 'center' }}
        >
          <Glass theme={theme} radius={999} />
          <View style={{ position: 'relative', zIndex: 1 }}>
            <Icon name="bookmark" size={21} color={theme.accent} filled />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
