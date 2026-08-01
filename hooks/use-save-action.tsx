import React, { createContext, useCallback, useContext, useMemo, useRef } from 'react';

type Handler = () => void;

type SaveActionContextValue = {
  /** Fired by the tab bar's bookmark button. */
  request: () => void;
  /** Registers the calculator's "open save sheet" handler; returns an unsubscribe. */
  register: (handler: Handler) => () => void;
};

const SaveActionContext = createContext<SaveActionContextValue | null>(null);

/**
 * The redesign moves "save this scenario" out of the page and into a pill
 * beside the tab bar, so the button and the sheet it opens live in different
 * trees. This carries the press across without duplicating calculator state.
 */
export function SaveActionProvider({ children }: { children: React.ReactNode }) {
  const handler = useRef<Handler | null>(null);

  const register = useCallback((next: Handler) => {
    handler.current = next;
    return () => {
      if (handler.current === next) handler.current = null;
    };
  }, []);

  const request = useCallback(() => {
    handler.current?.();
  }, []);

  const value = useMemo(() => ({ request, register }), [request, register]);

  return <SaveActionContext.Provider value={value}>{children}</SaveActionContext.Provider>;
}

export function useSaveAction() {
  const context = useContext(SaveActionContext);
  if (!context) {
    throw new Error('useSaveAction must be used within a SaveActionProvider');
  }
  return context;
}
