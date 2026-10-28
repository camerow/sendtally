import {
  bumpLoad,
  toUnit,
  type HangKind,
  type TrendSummary,
  type WeightUnit,
} from "@sendtally/core/hang";
import { dayMonth, loadLabel } from "@sendtally/features/hang";
import { formatNumber, t } from "@sendtally/features/i18n";

export type TrendContext = {
  workout: string;
  grip: string;
  kind: HangKind;
  unit: WeightUnit;
};

/** The latest completed load minus the first, in the display unit; 0 before any is complete. */
export function changeOf(summary: TrendSummary, unit: WeightUnit): number {
  return summary.first === null || summary.last === null
    ? 0
    : toUnit(summary.last, unit) - toUnit(summary.first, unit);
}

function trendLine(summary: TrendSummary, ctx: TrendContext): string | null {
  const load = (kg: number): string => loadLabel(ctx.kind, kg, ctx.unit);
  const change = changeOf(summary, ctx.unit);
  if (change > 0)
    return summary.avgRpe === null
      ? t("hang.insightUpNoEffort", {
          workout: ctx.workout,
          grip: ctx.grip.toLowerCase(),
          change: `${formatNumber(change)} ${ctx.unit}`,
          weeks: summary.weeks,
        })
      : t("hang.insightUp", {
          workout: ctx.workout,
          grip: ctx.grip.toLowerCase(),
          change: `${formatNumber(change)} ${ctx.unit}`,
          weeks: summary.weeks,
          rpe: formatNumber(summary.avgRpe, {
            maximumFractionDigits: 1,
            minimumFractionDigits: 1,
          }),
        });
  if (summary.completed < 2 || summary.last === null) return null;
  return t("hang.insightHeld", {
    load: load(summary.last),
    next: load(bumpLoad(ctx.kind, summary.last, ctx.unit, 1)),
  });
}

/** What the trend says, or "" when it says nothing yet. */
export function insight(summary: TrendSummary, ctx: TrendContext): string {
  const load = (kg: number): string => loadLabel(ctx.kind, kg, ctx.unit);
  if (summary.best === null) return t("hang.insightNoneComplete", { load: load(summary.latest) });
  const attempt = summary.topAttempt;
  return [
    trendLine(summary, ctx),
    attempt === null
      ? null
      : t("hang.insightAttempt", {
          load: load(attempt.loadKg),
          date: dayMonth(attempt.date),
          pct: attempt.pct,
        }),
  ]
    .filter((line) => line !== null)
    .join(" ");
}
