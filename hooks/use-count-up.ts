import { useEffect, useRef, useState } from 'react';

/**
 * Eases a displayed number toward `target` whenever it changes (easeOutCubic).
 * Mirrors the count-up in the design's balance readout.
 */
export function useCountUp(target: number, duration = 650): number {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const rafish = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const start = fromRef.current;
    const steps = Math.max(1, Math.round(duration / 32));
    let i = 0;
    if (rafish.current) clearInterval(rafish.current);
    rafish.current = setInterval(() => {
      i++;
      const t = Math.min(1, i / steps);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(start + (target - start) * eased);
      setDisplay(value);
      fromRef.current = value;
      if (t >= 1 && rafish.current) clearInterval(rafish.current);
    }, 32);
    return () => {
      if (rafish.current) clearInterval(rafish.current);
    };
  }, [target, duration]);

  return display;
}
