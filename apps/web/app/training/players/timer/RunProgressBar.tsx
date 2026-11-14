import React from "react";
import { isWork, runPercent, type Run } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";

/**
 * The whole workout as the phase bar: finished segments filled, the current one filling
 * from the frame's `--p`, the rest faint.
 */
export function RunProgressBar({ run }: { run: Run }): React.ReactElement {
  return (
    <div
      className="timer-bar"
      role="progressbar"
      aria-label={t("hang.progress")}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={runPercent(run)}
    >
      {run.phases.slice(1).map((phase, i) => {
        const at = i + 1;
        const done = at < run.index || run.finished !== null;
        return (
          <span
            key={i}
            className={isWork(phase.kind) ? "timer-seg timer-seg--work" : "timer-seg"}
            style={{ flexGrow: phase.seconds }}
          >
            {(done || at === run.index) && (
              <span className={done ? "timer-seg-fill" : "timer-seg-fill timer-seg-fill--live"} />
            )}
          </span>
        );
      })}
    </div>
  );
}
