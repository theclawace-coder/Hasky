import { useEffect, useRef, useState } from 'react';

interface UseCountUpOptions {
  end: number;
  start?: number;
  duration?: number;
  decimals?: number;
  enabled?: boolean;
}

/**
 * Animated count-up hook.
 * Returns a formatted number string that animates from `start` to `end`.
 */
export function useCountUp({
  end,
  start = 0,
  duration = 1200,
  decimals = 0,
  enabled = true,
}: UseCountUpOptions): number {
  const [value, setValue] = useState(enabled ? start : end);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const prevEndRef = useRef(end);

  useEffect(() => {
    if (!enabled) {
      setValue(end);
      return;
    }

    const from = prevEndRef.current !== end ? prevEndRef.current : start;
    prevEndRef.current = end;

    const ease = (t: number) => 1 - Math.pow(1 - t, 3); // ease-out cubic

    startTimeRef.current = performance.now();

    function tick(now: number) {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = ease(progress);
      const current = from + (end - from) * eased;

      setValue(Number(current.toFixed(decimals)));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [end, start, duration, decimals, enabled]);

  return value;
}
