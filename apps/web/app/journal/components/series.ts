import type { TrendSeries } from "@sendtally/features/trends";

/** The palette lives in trends.css, so one token change recolours every chart. */
export function seriesColour(series: TrendSeries): string {
  return `var(--series-${series})`;
}
