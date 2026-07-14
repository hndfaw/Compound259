import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Font } from '@/constants/tokens';
import { useTheme } from '@/hooks/use-theme';
import { Icon, IconName } from './icon';

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Calculator', icon: 'trending' },
  explore: { label: 'Saved', icon: 'bookmark' },
  learn: { label: 'Learn', icon: 'book' },
};

/** Floating glass tab bar matching the redesign. */
export function GlassTabBar({ state, navigation }: BottomTabBarProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginTop: 0,
        marginBottom: Math.max(20, insets.bottom),
        padding: 6,
        borderRadius: 24,
        flexDirection: 'row',
        gap: 4,
        backgroundColor: theme.glassTint,
        borderWidth: 1,
        borderColor: theme.glassBorder,
        shadowColor: '#000',
        shadowOpacity: 0.4,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 12 },
        elevation: 8,
      }}
    >
      {state.routes.map((route, index) => {
        const config = TABS[route.name];
        if (!config) return null;
        const focused = state.index === index;
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
              borderRadius: 16,
              paddingVertical: 9,
              alignItems: 'center',
              gap: 4,
              backgroundColor: focused ? theme.glassTint : 'transparent',
              borderWidth: focused ? 0.5 : 0,
              borderColor: theme.glassBorder,
            }}
          >
            <Icon name={config.icon} size={20} color={color} strokeWidth={2.1} filled={focused && route.name === 'explore'} />
            <Text style={{ fontFamily: Font.bodyBold, fontSize: 10.5, color }}>{config.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
