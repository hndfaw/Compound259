import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, TouchableOpacity } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { Icon } from './icon';

/** Moon / sun tile that flips the active theme. */
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme.mode === 'dark';
  return (
    <TouchableOpacity
      onPress={() => {
        if (Platform.OS === 'ios') Haptics.selectionAsync();
        toggle();
      }}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      style={{
        width: 36,
        height: 36,
        borderRadius: 11,
        backgroundColor: theme.mutedBg,
        borderWidth: 1,
        borderColor: theme.mutedBorder,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon name={isDark ? 'moon' : 'sun'} size={isDark ? 17 : 18} color={theme.mutedCol} />
    </TouchableOpacity>
  );
}
