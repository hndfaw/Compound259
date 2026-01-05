import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

const DEFAULT_ACCENT = '#10B981';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type ScreenHeaderProps = {
  icon: IoniconName;
  title: string;
  subtitle?: string;
  accent?: string;
  iconSize?: number;
};

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return `rgba(0,0,0,${alpha})`;
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export function ScreenHeader({ icon, title, subtitle, accent = DEFAULT_ACCENT, iconSize = 22 }: ScreenHeaderProps) {
  const badgeColor = hexToRgba(accent, 0.16);

  return (
    <View style={styles.headerGroup}>
      <View style={styles.headerRow}>
        <View style={[styles.headerBadge, { backgroundColor: badgeColor }]}> 
          <Ionicons name={icon} size={iconSize} color={accent} />
        </View>
        <ThemedText style={styles.headerTitle}>{title}</ThemedText>
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
});
