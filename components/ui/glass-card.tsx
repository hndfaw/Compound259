import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/**
 * Card surface: translucent "glass" in Aurora, solid white in Daylight. The
 * shadow recipe (including the dark theme's inset highlight) comes straight
 * from the spec's `--card-shadow`.
 */
export function GlassCard({
  style,
  children,
  radius = 22,
}: {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  radius?: number;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
          borderWidth: 1,
          borderRadius: radius,
          boxShadow: theme.cardShadow,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
