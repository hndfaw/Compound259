import React from 'react';
import { Platform, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/hooks/use-theme';
import { Icon } from './icon';

/** Moon / sun tile that flips the active theme. */
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <TouchableOpacity
      onPress={() => {
        if (Platform.OS === 'ios') Haptics.selectionAsync();
        toggle();
      }}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={theme.mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      style={{
        width: 36,
        height: 36,
        borderRadius: 11,
        backgroundColor: theme.mutedBg,
        borderWidth: 1,
        borderColor: theme.mutedBorder,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={theme.mode === 'dark' ? 'moon' : 'sun'} size={17} color={theme.mutedCol} />
    </TouchableOpacity>
  );
}
