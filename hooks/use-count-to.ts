import { useCallback, useEffect, useRef, useState } from 'react';

const TICK_MS = 32;

/**
 * Imperative count-up for the balance readout, mirroring `animateTo()` in the
 * redesign spec: each interaction picks its own duration (a keystroke nudges
 * over 280ms, entering the screen rolls up from zero over 1.6s).
 */
export function useCountTo(initial = 0) {
  const [value, setValue] = useState(initial);
  const current = useRef(initial);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  /** Ease `value` toward `target`; pass `from` to restart at a known number. */
  const animateTo = useCallback(
    (target: number, duration = 700, from?: number) => {
      clear();
      const safeTarget = Number.isFinite(target) ? Math.round(target) : 0;
      const start = from ?? current.current;
      current.current = start;
      setValue(start);

      const steps = Math.max(1, Math.round(duration / TICK_MS));
      let i = 0;
      timer.current = setInterval(() => {
        i += 1;
        const t = Math.min(1, i / steps);
        const eased = 1 - Math.pow(1 - t, 3);
        const next = Math.round(start + (safeTarget - start) * eased);
        current.current = next;
        setValue(next);
        if (t >= 1) clear();
      }, TICK_MS);
    },
    [clear],
  );

  /** Stop mid-flight and pin the readout to an exact number. */
  const set = useCallback(
    (next: number) => {
      clear();
      const safe = Number.isFinite(next) ? Math.round(next) : 0;
      current.current = safe;
      setValue(safe);
    },
    [clear],
  );

  useEffect(() => clear, [clear]);

  return { value, animateTo, set, stop: clear };
}
