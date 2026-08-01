import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, LayoutChangeEvent, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

const ORDER = ['index', 'explore', 'learn'];
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
  const activeName = state.routes[state.index]?.name ?? 'index';
  const activeIndex = Math.max(0, ORDER.indexOf(activeName));
  const onCalc = activeName === 'index';

  const [rowWidth, setRowWidth] = useState(0);
  const slide = useRef(new Animated.Value(activeIndex)).current;
  const action = useRef(new Animated.Value(onCalc ? 1 : 0)).current;

  useEffect(() => {
    const anim = Animated.timing(slide, {
      toValue: activeIndex,
      duration: 500,
      easing: SPRINGY,
      useNativeDriver: true,
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

  const onRowLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== rowWidth) setRowWidth(w);
  };

  const cellWidth = routes.length > 0 ? rowWidth / routes.length : 0;

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
        <View style={{ flexDirection: 'row', flex: 1, position: 'relative', zIndex: 1 }} onLayout={onRowLayout}>
          {cellWidth > 0 ? (
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: cellWidth,
                borderRadius: 999,
                overflow: 'hidden',
                borderWidth: 0.5,
                borderColor: theme.pillBorder,
                boxShadow: theme.pillShine,
                transform: [
                  {
                    translateX: slide.interpolate({
                      inputRange: [0, Math.max(1, routes.length - 1)],
                      outputRange: [0, cellWidth * Math.max(1, routes.length - 1)],
                    }),
                  },
                ],
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
          ) : null}

          {routes.map((route) => {
            const config = TABS[route.name];
            const focused = route.name === activeName;
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
