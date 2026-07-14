import React from 'react';
import { View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/** Three-segment principal / contributions / interest progress bar. */
export function SegmentBar({
  principalPct,
  contribPct,
}: {
  principalPct: number; // 0-100
  contribPct: number; // 0-100
}) {
  const { theme } = useTheme();
  return (
    <View style={{ height: 9, borderRadius: 6, overflow: 'hidden', flexDirection: 'row', backgroundColor: theme.track }}>
      <View style={{ width: `${principalPct}%`, backgroundColor: theme.cPrincipal }} />
      <View style={{ width: `${contribPct}%`, backgroundColor: theme.cContrib }} />
      <View style={{ flex: 1, backgroundColor: theme.cInterest }} />
    </View>
  );
}
