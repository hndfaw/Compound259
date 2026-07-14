import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

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

type CalculationsContextValue = {
  calculations: SavedCalculation[];
  isLoading: boolean;
  saveCalculation: (calculation: Omit<SavedCalculation, 'id' | 'date'>) => Promise<SavedCalculation>;
  updateCalculation: (id: string, updates: Partial<SavedCalculation>) => Promise<void>;
  deleteCalculation: (id: string) => Promise<void>;
  refreshCalculations: () => Promise<void>;
};

const CalculationsContext = createContext<CalculationsContextValue | null>(null);

/**
 * Holds the saved calculations once for the whole app so both tabs read and
 * write the same source of truth (previously each screen kept its own copy and
 * relied on a focus-refresh to stay in sync).
 */
export function CalculationsProvider({ children }: { children: React.ReactNode }) {
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

  return (
    <CalculationsContext.Provider
      value={{
        calculations,
        isLoading,
        saveCalculation,
        updateCalculation,
        deleteCalculation,
        refreshCalculations: loadCalculations,
      }}
    >
      {children}
    </CalculationsContext.Provider>
  );
}

export function useCalculations() {
  const context = useContext(CalculationsContext);
  if (!context) {
    throw new Error('useCalculations must be used within a CalculationsProvider');
  }
  return context;
}
