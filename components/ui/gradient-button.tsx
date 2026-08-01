import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleProp, TouchableOpacity, ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/**
 * Primary action surface. Aurora paints the accent gradient; Daylight's
 * `--btn-grad` is a single solid colour, so a one-entry palette is repeated to
 * keep LinearGradient happy while rendering flat.
 */
export function GradientButton({
  onPress,
  children,
  style,
  contentStyle,
  colors,
  radius = 16,
  disabled,
  shadow = false,
}: {
  onPress?: () => void;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  colors?: readonly string[];
  radius?: number;
  disabled?: boolean;
  /** Apply the spec's `--btn-shadow` glow. */
  shadow?: boolean;
}) {
  const { theme } = useTheme();
  const palette = colors ?? theme.btnGrad;
  const gradientColors = (palette.length > 1 ? palette : [palette[0], palette[0]]) as [string, string, ...string[]];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      accessibilityRole={onPress ? 'button' : undefined}
      style={[{ borderRadius: radius, overflow: 'hidden' }, shadow && { boxShadow: theme.btnShadow }, style]}
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
