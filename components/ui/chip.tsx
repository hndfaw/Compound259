import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { Font } from '@/constants/tokens';
import { useTheme } from '@/hooks/use-theme';

/** Preset value chip; fills the accent-soft state when active. */
export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.chip,
        {
          backgroundColor: active ? theme.accentSoft : 'transparent',
          borderColor: active ? theme.accentBorder : theme.chipOffBorder,
        },
      ]}
    >
      <Text style={[styles.label, { color: active ? theme.accent : theme.chipOffCol }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: Font.displayMed,
    fontSize: 12.5,
  },
});
