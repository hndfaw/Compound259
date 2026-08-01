import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

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

/** Records with a missing id or title would break edit/delete, so drop them. */
const isRecord = (value: unknown): value is SavedCalculation =>
  !!value &&
  typeof value === 'object' &&
  typeof (value as SavedCalculation).id === 'string' &&
  typeof (value as SavedCalculation).title === 'string';

const parseStored = (raw: string | null): SavedCalculation[] => {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isRecord) : [];
  } catch {
    return [];
  }
};

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Holds the saved calculations once for the whole app so both tabs read and
 * write the same source of truth.
 *
 * Every mutation goes through a single promise queue and reads the list from a
 * ref rather than a render-time closure. Two writes fired back to back (say a
 * fast delete-delete) therefore apply on top of each other instead of the
 * second one silently resurrecting what the first removed. Storage is written
 * before state, so a failed write leaves the UI showing what is actually on
 * disk.
 */
export function CalculationsProvider({ children }: { children: React.ReactNode }) {
  const [calculations, setCalculations] = useState<SavedCalculation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const listRef = useRef<SavedCalculation[]>([]);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  /** Serialize a mutation behind any already-running one. */
  const enqueue = useCallback(<T,>(task: () => Promise<T>): Promise<T> => {
    const next = queue.current.then(task, task);
    queue.current = next.catch(() => undefined);
    return next;
  }, []);

  const apply = useCallback(async (next: SavedCalculation[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    listRef.current = next;
    if (alive.current) setCalculations(next);
  }, []);

  const refreshCalculations = useCallback(
    () =>
      enqueue(async () => {
        try {
          const stored = parseStored(await AsyncStorage.getItem(STORAGE_KEY));
          listRef.current = stored;
          if (alive.current) setCalculations(stored);
        } catch (error) {
          console.error('Failed to load calculations:', error);
        } finally {
          if (alive.current) setIsLoading(false);
        }
      }),
    [enqueue],
  );

  useEffect(() => {
    refreshCalculations();
  }, [refreshCalculations]);

  const saveCalculation = useCallback(
    (calculation: Omit<SavedCalculation, 'id' | 'date'>) =>
      enqueue(async () => {
        const record: SavedCalculation = {
          ...calculation,
          id: newId(),
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        };
        await apply([record, ...listRef.current]);
        return record;
      }),
    [enqueue, apply],
  );

  const updateCalculation = useCallback(
    (id: string, updates: Partial<SavedCalculation>) =>
      enqueue(async () => {
        if (!listRef.current.some((c) => c.id === id)) return;
        await apply(listRef.current.map((c) => (c.id === id ? { ...c, ...updates, id: c.id } : c)));
      }),
    [enqueue, apply],
  );

  const deleteCalculation = useCallback(
    (id: string) =>
      enqueue(async () => {
        if (!listRef.current.some((c) => c.id === id)) return;
        await apply(listRef.current.filter((c) => c.id !== id));
      }),
    [enqueue, apply],
  );

  const value = useMemo<CalculationsContextValue>(
    () => ({ calculations, isLoading, saveCalculation, updateCalculation, deleteCalculation, refreshCalculations }),
    [calculations, isLoading, saveCalculation, updateCalculation, deleteCalculation, refreshCalculations],
  );

  return <CalculationsContext.Provider value={value}>{children}</CalculationsContext.Provider>;
}

export function useCalculations() {
  const context = useContext(CalculationsContext);
  if (!context) {
    throw new Error('useCalculations must be used within a CalculationsProvider');
  }
  return context;
}
