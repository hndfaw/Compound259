import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import { Animated, PanResponder, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from './themed-text';

type GestureStepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  formatValue?: (value: number) => string;
  suffix?: string;
  accentColor?: string;
};

export function GestureStepper({
  value,
  onChange,
  min = 0,
  max = 100000,
  step = 50,
  formatValue = (v) => v.toLocaleString(),
  suffix = '',
  accentColor = '#10B981',
}: GestureStepperProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragX = useRef(new Animated.Value(0)).current;
  const lastValue = useRef(value);
  const dragStartX = useRef(0);

  const getStepSize = (currentValue: number) => {
    if (currentValue < 100) return 10;
    if (currentValue < 1000) return 50;
    if (currentValue < 10000) return 100;
    return 500;
  };

  const clampValue = (val: number) => Math.max(min, Math.min(max, val));

  const increment = () => {
    const newValue = clampValue(value + getStepSize(value));
    onChange(newValue);
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const decrement = () => {
    const newValue = clampValue(value - getStepSize(value));
    onChange(newValue);
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 5,
      onPanResponderGrant: (_, gestureState) => {
        setIsDragging(true);
        dragStartX.current = gestureState.x0;
        lastValue.current = value;
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      },
      onPanResponderMove: (_, gestureState) => {
        dragX.setValue(gestureState.dx);

        // Calculate value change based on drag distance
        const sensitivity = 0.5; // Adjust sensitivity
        const deltaValue = Math.round((gestureState.dx * sensitivity) / 2) * getStepSize(lastValue.current);
        const newValue = clampValue(lastValue.current + deltaValue);

        if (newValue !== value) {
          onChange(newValue);
          if (Platform.OS === 'ios' && Math.abs(newValue - value) >= getStepSize(value)) {
            Haptics.selectionAsync();
          }
        }
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
        Animated.spring(dragX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }).start();
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      },
    })
  ).current;

  const containerScale = dragX.interpolate({
    inputRange: [-100, 0, 100],
    outputRange: [0.98, 1, 0.98],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, { borderColor: accentColor }]}
        onPress={decrement}
        activeOpacity={0.7}
        disabled={value <= min}
      >
        <Ionicons name="remove" size={20} color={value <= min ? '#4B5563' : accentColor} />
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.valueContainer,
          {
            borderColor: isDragging ? accentColor : '#374151',
            transform: [{ scale: containerScale }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.dragIndicator}>
          <View style={[styles.dragLine, { backgroundColor: accentColor }]} />
          <View style={[styles.dragLine, { backgroundColor: accentColor }]} />
          <View style={[styles.dragLine, { backgroundColor: accentColor }]} />
        </View>
        <ThemedText style={styles.value}>
          {formatValue(value)}
          {suffix && <ThemedText style={styles.suffix}> {suffix}</ThemedText>}
        </ThemedText>
        {isDragging && (
          <ThemedText style={[styles.dragHint, { color: accentColor }]}>
            Swipe to adjust
          </ThemedText>
        )}
      </Animated.View>

      <TouchableOpacity
        style={[styles.button, { borderColor: accentColor }]}
        onPress={increment}
        activeOpacity={0.7}
        disabled={value >= max}
      >
        <Ionicons name="add" size={20} color={value >= max ? '#4B5563' : accentColor} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    minHeight: 60,
    justifyContent: 'center',
  },
  dragIndicator: {
    position: 'absolute',
    top: 8,
    flexDirection: 'row',
    gap: 3,
  },
  dragLine: {
    width: 20,
    height: 3,
    borderRadius: 2,
    opacity: 0.3,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  suffix: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  dragHint: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    opacity: 0.7,
  },
});
