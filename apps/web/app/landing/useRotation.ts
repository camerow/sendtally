import React from "react";
import { prefersReducedMotion } from "./useInView";

export function useRotation(count: number, intervalMs: number): number {
  const [index, setIndex] = React.useState(0);
  React.useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), intervalMs);
    return () => clearInterval(id);
  }, [count, intervalMs]);
  return index;
}
