import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/constants/tokens';

/**
 * Full-screen themed backdrop: a soft vertical gradient in Daylight, and three
 * drifting aurora blobs over a near-black base in dark mode.
 */
export function ScreenBackground() {
  const { theme } = useTheme();

  if (theme.mode === 'light' && theme.bgGradient) {
    return (
      <LinearGradient
        colors={theme.bgGradient as [string, string]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
    );
  }

  const [b1, b2, b3] = theme.blobs;
  const o = theme.blobOpacity;

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.bg }]}>
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="b1" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={b1} stopOpacity={o} />
            <Stop offset="0.7" stopColor={b1} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="b2" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={b2} stopOpacity={o} />
            <Stop offset="0.7" stopColor={b2} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="b3" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={b3} stopOpacity={o} />
            <Stop offset="0.7" stopColor={b3} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={90} cy={70} r={190} fill="url(#b1)" />
        <Circle cx={360} cy={260} r={180} fill="url(#b2)" />
        <Circle cx={60} cy={640} r={170} fill="url(#b3)" />
      </Svg>
    </View>
  );
}

// re-exported for convenience where a translucent tint of the accent is needed
export { withAlpha };
