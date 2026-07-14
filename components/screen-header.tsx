import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppColors, withAlpha } from '@/constants/tokens';

const DEFAULT_ACCENT = AppColors.accent;

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type ScreenHeaderProps = {
  icon: IoniconName;
  title: string;
  subtitle?: string;
  accent?: string;
  iconSize?: number;
  onHelpPress?: () => void;
};

export function ScreenHeader({ icon, title, subtitle, accent = DEFAULT_ACCENT, iconSize = 22, onHelpPress }: ScreenHeaderProps) {
  const badgeColor = withAlpha(accent, 0.16);

  return (
    <View style={styles.headerGroup}>
      <View style={styles.headerRow}>
        <View style={[styles.headerBadge, { backgroundColor: badgeColor }]}>
          <Ionicons name={icon} size={iconSize} color={accent} />
        </View>
        <ThemedText style={styles.headerTitle}>{title}</ThemedText>
        {onHelpPress && (
          <TouchableOpacity style={styles.helpButton} onPress={onHelpPress} activeOpacity={0.7}>
            <Ionicons name="help-circle-outline" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>
      {subtitle ? <ThemedText style={styles.headerSubtitle}>{subtitle}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headerGroup: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#9CA3AF',
    lineHeight: 22,
    fontWeight: '500',
  },
  helpButton: {
    marginLeft: 'auto',
    padding: 4,
  },
});
