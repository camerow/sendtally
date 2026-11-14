import React from "react";
import type { JournalEntry } from "@sendtally/api-client";
import { tripDays, tripEffort, type LogItem } from "@sendtally/features/journal";

/** Past this many days the strip is wider than the title it sits beside. */
const MAX_DOTS = 12;

/** The hardest RPE of each day of a trip, a dot of a day nobody climbed. */
export function TripEffort({
  trip,
  inside,
}: {
  trip: JournalEntry;
  inside: readonly LogItem[];
}): React.ReactElement | null {
  const sessions = inside.flatMap((i) => (i.type === "session" ? [i.session] : []));
  const entries = inside.flatMap((i) => (i.type === "entry" ? [i.entry] : []));
  const effort = tripEffort(tripDays(trip, sessions, entries));
  if (effort.length > MAX_DOTS || !effort.some((rpe) => rpe !== null)) return null;
  return (
    <span className="trip-effort" aria-hidden>
      {effort.map((rpe, i) => (
        <span
          key={i}
          className={
            rpe === null
              ? "trip-dot trip-dot--empty"
              : rpe >= 8
                ? "trip-dot trip-dot--hard"
                : "trip-dot"
          }
          style={{ height: rpe === null ? 6 : 6 + rpe * 1.6 }}
        />
      ))}
    </span>
  );
}
