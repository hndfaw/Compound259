import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from './themed-text';

type TooltipProps = {
  visible: boolean;
  message: string;
  onDismiss: () => void;
  arrow?: 'top' | 'bottom' | 'none';
};

export function TutorialTooltip({ visible, message, onDismiss, arrow = 'top' }: TooltipProps) {
  if (!visible) return null;

  return (
    <Animated.View style={styles.container}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.tooltipContainer} activeOpacity={1}>
          {arrow === 'top' && <View style={styles.arrowTop} />}
          <View style={styles.tooltip}>
            <View style={styles.iconContainer}>
              <Ionicons name="bulb" size={18} color="#10B981" />
            </View>
            <ThemedText style={styles.message}>{message}</ThemedText>
            <TouchableOpacity style={styles.gotItButton} onPress={onDismiss}>
              <ThemedText style={styles.gotItText}>Got it!</ThemedText>
            </TouchableOpacity>
          </View>
          {arrow === 'bottom' && <View style={styles.arrowBottom} />}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  tooltipContainer: {
    alignItems: 'center',
  },
  arrowTop: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#1F2937',
    marginBottom: -1,
  },
  arrowBottom: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1F2937',
    marginTop: -1,
  },
  tooltip: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#10B981',
    maxWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    alignSelf: 'center',
  },
  message: {
    fontSize: 14,
    color: '#E5E7EB',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 14,
  },
  gotItButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  gotItText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
