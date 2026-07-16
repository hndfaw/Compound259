import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Font } from '@/constants/tokens';
import { useTheme } from '@/hooks/use-theme';
import { ScreenBackground } from './screen-background';
import { ThemeToggle } from './theme-toggle';

/** Themed screen scaffold: aurora/daylight backdrop, header row, scroll body. */
export function Screen({
  title,
  subtitle,
  children,
  refreshing,
  onRefresh,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        // Without this, a Touchable inside a Modal whose parent is this ScrollView
        // needs two taps while the keyboard is open — the first tap only dismisses
        // the keyboard (facebook/react-native#28871).
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: insets.top + 14, paddingHorizontal: 18, paddingBottom: 24 }}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={theme.accent} colors={[theme.accent]} />
          ) : undefined
        }
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            {subtitle ? <Text style={[styles.subtitle, { color: theme.sub }]}>{subtitle}</Text> : null}
          </View>
          <ThemeToggle />
        </View>
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  title: {
    fontFamily: Font.displayBold,
    fontSize: 26,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: Font.body,
    fontSize: 12.5,
    marginTop: 3,
  },
});
