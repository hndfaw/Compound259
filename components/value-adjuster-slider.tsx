import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useRef } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

type ValueAdjusterSliderProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  accentColor?: string;
};

export function ValueAdjusterSlider({
  value,
  onChange,
  min = 0,
  max = 100000,
  accentColor = '#10B981',
}: ValueAdjusterSliderProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearAutoIncrement = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const getStepSize = (currentValue: number) => {
    if (currentValue < 100) return 10;
    if (currentValue < 1000) return 50;
    if (currentValue < 10000) return 100;
    return 500;
  };

  const adjustValue = (direction: 'increase' | 'decrease') => {
    const step = getStepSize(value);
    const delta = direction === 'increase' ? step : -step;
    const newValue = Math.max(min, Math.min(max, value + delta));

    if (newValue !== value) {
      onChange(newValue);

      // Haptic feedback every step
      if (Platform.OS === 'ios') {
        Haptics.selectionAsync();
      }
    }
  };

  const handlePressIn = (direction: 'increase' | 'decrease') => {
    // Immediate adjustment
    adjustValue(direction);

    // Start continuous adjustment after a short delay
    setTimeout(() => {
      intervalRef.current = setInterval(() => {
        adjustValue(direction);
      }, 100);
    }, 300);
  };

  const handlePressOut = () => {
    clearAutoIncrement();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, { borderColor: accentColor }]}
        onPressIn={() => handlePressIn('decrease')}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
        disabled={value <= min}
      >
        <Ionicons name="remove" size={20} color={value <= min ? '#4B5563' : accentColor} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { borderColor: accentColor }]}
        onPressIn={() => handlePressIn('increase')}
        onPressOut={handlePressOut}
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
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  button: {
    width: 50,
    height: 36,
    borderRadius: 8,
    borderWidth: 1.5,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
