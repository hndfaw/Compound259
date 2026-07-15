import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/** Translucent "glass" surface (dark) or solid card with soft shadow (light). */
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
        },
        theme.cardShadow && {
          shadowColor: '#142819',
          shadowOpacity: 0.08,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 3,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
