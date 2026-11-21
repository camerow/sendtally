import React from "react";
import { t } from "@sendtally/features/i18n";
import type { HardestInYear } from "@sendtally/features/settings";

export type YearBarsProps = {
  years: readonly HardestInYear[];
  /** At most 24px tall, for a card beside a form. */
  compact?: boolean;
};

/** Hardest send by year: a gold bar a year, as tall as its grade, the grade over it. */
export function YearBars({ years, compact = false }: YearBarsProps): React.ReactElement {
  const ranks = years.map((y) => y.rank);
  const lo = Math.max(0, Math.min(...ranks) - 2);
  const span = Math.max(1, Math.max(...ranks) - lo);
  return (
    <div className="year-bars">
      <span className="dark-label">{t("onboarding.history.card.hardestByYear")}</span>
      <div
        role="img"
        aria-label={years.map((y) => `${y.year}: ${y.gradeLabel}`).join(". ")}
        className="year-bars-row"
      >
        {years.map((y) => (
          <span key={y.year} className="year-bars-col">
            <span className="year-bars-grade">{y.gradeLabel}</span>
            <span
              className="year-bars-bar"
              style={{
                height: compact
                  ? 6 + ((y.rank - lo) / span) * 18
                  : 14 + ((y.rank - lo) / span) * 46,
              }}
            />
            <span className="year-bars-year">{String(y.year).slice(2)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
