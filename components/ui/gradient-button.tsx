import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleProp, TouchableOpacity, ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/** Accent gradient surface used for primary actions and balance panels. */
export function GradientButton({
  onPress,
  children,
  style,
  contentStyle,
  colors,
  radius = 16,
  disabled,
}: {
  onPress?: () => void;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  colors?: readonly string[];
  radius?: number;
  disabled?: boolean;
}) {
  const { theme } = useTheme();
  const gradientColors = (colors ?? theme.btnGrad) as [string, string, ...string[]];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      style={[{ borderRadius: radius, overflow: 'hidden' }, style]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 9,
            paddingVertical: 16,
            paddingHorizontal: 16,
          },
          contentStyle,
        ]}
      >
        {children}
      </LinearGradient>
    </TouchableOpacity>
  );
}
