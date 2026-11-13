import React from "react";
import { durationLabel, elapsedClock } from "@sendtally/features/sessions";

/** A running clock, worked out from its start every second; read aloud in minutes. */
export function LiveClock({
  elapsed,
  className,
}: {
  /** Seconds since the start, at a moment. */
  elapsed: (now: Date) => number;
  className: string;
}): React.ReactElement {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const seconds = elapsed(now);
  return (
    <span className={className} aria-label={durationLabel(Math.floor(seconds / 60))}>
      {elapsedClock(seconds)}
    </span>
  );
}
