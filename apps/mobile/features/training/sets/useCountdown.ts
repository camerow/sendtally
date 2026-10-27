import React from "react";

export type Countdown = { secondsLeft: number; start: (seconds: number) => void };

/** Whole seconds left on a countdown, ticking each second; 0 when none is running. */
export function useCountdown(): Countdown {
  const [clock, setClock] = React.useState({ endsAt: 0, now: 0 });
  const running = clock.endsAt > clock.now;
  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setClock((c) => ({ ...c, now: Date.now() })), 1000);
    return () => clearInterval(id);
  }, [running, clock.endsAt]);
  const start = React.useCallback((seconds: number): void => {
    const now = Date.now();
    setClock({ endsAt: now + seconds * 1000, now });
  }, []);
  return { secondsLeft: Math.max(0, Math.ceil((clock.endsAt - clock.now) / 1000)), start };
}
