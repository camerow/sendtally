import React from "react";

declare function requestAnimationFrame(step: () => void): number;
declare function cancelAnimationFrame(frame: number): void;

/**
 * Counts a number toward its target with an ease-out, from wherever it was
 * showing, so a hovered bucket or a new filter reads as the number moving.
 */
export function useTween(target: number | null, duration: number): number | null {
  const [shown, setShown] = React.useState<number | null>(target);
  const last = React.useRef<number | null>(target);

  React.useEffect(() => {
    if (target === null) return;
    const start = last.current ?? 0;
    const t0 = Date.now();
    let frame = requestAnimationFrame(function step(): void {
      const k = Math.min(1, (Date.now() - t0) / duration);
      const value = start + (target - start) * (1 - Math.pow(1 - k, 3));
      last.current = value;
      setShown(value);
      if (k < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return target === null ? null : shown;
}
