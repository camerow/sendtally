import React from "react";
import type { RepMark } from "@sendtally/core/hang";

export type RepDotsProps = { reps: number; marks: readonly RepMark[]; working: boolean };

/** One dot per rep in the set: done filled, missed a muted ×, current ringed. */
export function RepDots({ reps, marks, working }: RepDotsProps): React.ReactElement {
  return (
    <div className="timer-dots" aria-hidden>
      {Array.from({ length: reps }, (_, i) => {
        const mark = marks[i];
        if (mark === "ok") return <span key={i} className="timer-dot timer-dot--ok" />;
        if (mark === "miss")
          return (
            <svg key={i} width={14} height={14} viewBox="0 0 14 14" className="timer-dot-miss">
              <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" />
            </svg>
          );
        const current = working && i === marks.length;
        return <span key={i} className={current ? "timer-dot timer-dot--now" : "timer-dot"} />;
      })}
    </div>
  );
}
