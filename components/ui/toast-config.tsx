import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Font } from '@/constants/tokens';
import { useTheme } from '@/hooks/use-theme';
import { Icon } from './icon';

function ToastPill({ text, ok }: { text?: string; ok: boolean }) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: theme.sheet, borderColor: theme.sheetBorder, shadowColor: '#000' },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: ok ? '#22c07d' : '#e5675f' }]}>
        {ok ? <Icon name="check" size={12} color="#fff" strokeWidth={3} /> : <Text style={styles.bang}>!</Text>}
      </View>
      <Text style={[styles.text, { color: theme.text }]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

export const toastConfig = {
  success: ({ text1 }: { text1?: string }) => <ToastPill text={text1} ok />,
  error: ({ text1 }: { text1?: string }) => <ToastPill text={text1} ok={false} />,
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 13,
    borderWidth: 1,
    shadowOpacity: 0.3,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  iconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bang: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  text: {
    fontFamily: Font.bodySemi,
    fontSize: 14,
  },
});
