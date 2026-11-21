import React from "react";
import { t } from "@sendtally/features/i18n";
import type { LoadBar } from "./types";

export type LoadBarsProps = {
  bars: readonly LoadBar[];
  /** The bars' area in pixels, the tallest week filling it. */
  height?: number;
};

/** A column per block week on the dark card: its load above, a gold bar sized by it, its week under. */
export function LoadBars({ bars, height = 52 }: LoadBarsProps): React.ReactElement {
  const max = Math.max(1, ...bars.map((b) => b.value));
  return (
    <div className="plan-path-bars">
      {bars.map((b, i) => (
        <div key={i} className="plan-path-bar">
          <span className="dark-meta plan-path-bar-load">{b.label}</span>
          <span className="plan-path-bar-track" style={{ height }}>
            <i
              className={b.deload ? "plan-path-bar-fill is-deload" : "plan-path-bar-fill"}
              style={{ height: Math.max(4, (b.value / max) * height) }}
            />
          </span>
          <span className="dark-meta plan-path-bar-week">{t("plan.weekShort", { n: i + 1 })}</span>
        </div>
      ))}
    </div>
  );
}
