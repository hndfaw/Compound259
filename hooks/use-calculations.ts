import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@saved_calculations';

export type SavedCalculation = {
  id: string;
  title: string;
  date: string;
  finalBalance: number;
  initialDeposit: number;
  interestEarned: number;
  contributions: number;
  contributionAmount: number;
  timePeriod: number;
  rateOfReturn: number;
  frequency: string;
};

export function useCalculations() {
  const [calculations, setCalculations] = useState<SavedCalculation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCalculations = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCalculations(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load calculations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCalculations();
  }, [loadCalculations]);

  const saveCalculation = useCallback(async (calculation: Omit<SavedCalculation, 'id' | 'date'>) => {
    try {
      const newCalculation: SavedCalculation = {
        ...calculation,
        id: Date.now().toString(),
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
      };
      const updated = [newCalculation, ...calculations];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setCalculations(updated);
      return newCalculation;
    } catch (error) {
      console.error('Failed to save calculation:', error);
      throw error;
    }
  }, [calculations]);

  const updateCalculation = useCallback(async (id: string, updates: Partial<SavedCalculation>) => {
    try {
      const updated = calculations.map((calc) =>
        calc.id === id ? { ...calc, ...updates } : calc
      );
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setCalculations(updated);
    } catch (error) {
      console.error('Failed to update calculation:', error);
      throw error;
    }
  }, [calculations]);

  const deleteCalculation = useCallback(async (id: string) => {
    try {
      const updated = calculations.filter((calc) => calc.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setCalculations(updated);
    } catch (error) {
      console.error('Failed to delete calculation:', error);
      throw error;
    }
  }, [calculations]);

  return {
    calculations,
    isLoading,
    saveCalculation,
    updateCalculation,
    deleteCalculation,
    refreshCalculations: loadCalculations,
  };
}
