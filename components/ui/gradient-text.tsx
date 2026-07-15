import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';

/**
 * Text filled with a horizontal gradient (dark theme balance). If `colors` has
 * a single entry it renders as solid text (light theme).
 */
export function GradientText({
  text,
  style,
  colors,
  numberOfLines,
}: {
  text: string;
  style?: StyleProp<TextStyle>;
  colors: readonly string[];
  numberOfLines?: number;
}) {
  if (colors.length < 2) {
    return (
      <Text style={[style, { color: colors[0] }]} numberOfLines={numberOfLines}>
        {text}
      </Text>
    );
  }

  return (
    <MaskedView
      maskElement={
        <Text style={[style, { color: '#000' }]} numberOfLines={numberOfLines}>
          {text}
        </Text>
      }
    >
      <LinearGradient
        colors={colors as [string, string, ...string[]]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
      >
        <Text style={[style, { opacity: 0 }]} numberOfLines={numberOfLines}>
          {text}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
}
