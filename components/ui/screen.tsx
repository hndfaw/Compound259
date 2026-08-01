import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Font } from '@/constants/tokens';
import { useTheme } from '@/hooks/use-theme';
import { ScreenEnter } from './motion';
import { ScreenBackground } from './screen-background';
import { ThemeToggle } from './theme-toggle';

/** Distance the floating tab bar sits above the bottom safe area. */
export const TAB_BAR_INSET = 18;
/** Height of the tab bar capsule, used to keep scroll content clear of it. */
export const TAB_BAR_HEIGHT = 55;

/**
 * Themed screen scaffold: aurora/daylight backdrop, header row, scroll body.
 *
 * Pass `title`/`subtitle` for the standard header, or `header` to supply a
 * custom one (the calculator's collapses while the keypad is open).
 */
export function Screen({
  title,
  subtitle,
  header,
  children,
  refreshing,
  onRefresh,
  scrollRef,
  scrollEnabled = true,
}: {
  title?: string;
  subtitle?: string;
  header?: React.ReactNode;
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  scrollRef?: React.RefObject<ScrollView | null>;
  scrollEnabled?: boolean;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <ScrollView
        ref={scrollRef}
        scrollEnabled={scrollEnabled}
        showsVerticalScrollIndicator={false}
        // Without this, a Touchable inside a Modal whose parent is this ScrollView
        // needs two taps while the keyboard is open — the first tap only dismisses
        // the keyboard (facebook/react-native#28871).
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + 6,
          paddingHorizontal: 18,
          paddingBottom: Math.max(TAB_BAR_INSET, insets.bottom) + TAB_BAR_HEIGHT + 24,
        }}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={theme.accent} colors={[theme.accent]} />
          ) : undefined
        }
      >
        <ScreenEnter>
          {header ?? (
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
                {subtitle ? <Text style={[styles.subtitle, { color: theme.sub }]}>{subtitle}</Text> : null}
              </View>
              <ThemeToggle />
            </View>
          )}
          {children}
        </ScreenEnter>
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
    fontSize: 13,
    marginTop: 3,
  },
});
