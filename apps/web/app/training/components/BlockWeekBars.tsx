import React from "react";
import { effortColor } from "@sendtally/design/tokens";
import { formatNumber, t } from "@sendtally/features/i18n";
import type { BlockWeek } from "@sendtally/features/training";

export type BlockWeekBarsProps = {
  weeks: readonly BlockWeek[];
  /** Small bars with no labels, on the dark log card. */
  compact?: boolean;
};

const fill = (w: BlockWeek): number => (w.planned === 0 ? 0 : w.done / w.planned);

const weekLabel = (w: BlockWeek): string =>
  [
    t("plan.weekShort", { n: w.week }),
    ...(w.effort === null ? [] : [`RPE ${formatNumber(Math.round(w.effort))}`]),
  ].join(" · ");

/** A column per week, filled as far as its sessions were done and coloured by its effort. */
export function BlockWeekBars({ weeks, compact = false }: BlockWeekBarsProps): React.ReactElement {
  return (
    <div
      className={compact ? "week-bars week-bars--compact" : "week-bars"}
      {...(compact && { "aria-hidden": true })}
    >
      {weeks.map((w) => (
        <div
          key={w.week}
          className="week-bar"
          {...(!compact && {
            role: "img",
            "aria-label": `${weekLabel(w)}, ${t("plan.doneOf", { done: w.done, planned: w.planned })}`,
          })}
        >
          {!compact && (
            <span className="week-bar-count">{`${formatNumber(w.done)}/${formatNumber(w.planned)}`}</span>
          )}
          <span className="week-bar-track">
            <span
              className="week-bar-fill"
              style={{
                height: `${Math.round(fill(w) * 100)}%`,
                ...(w.effort !== null && { background: effortColor(w.effort) }),
              }}
            />
          </span>
          {!compact && <span className="week-bar-label">{weekLabel(w)}</span>}
        </div>
      ))}
    </div>
  );
}
