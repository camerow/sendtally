import type { HangSessionRecord } from "@sendtally/api-client";
import {
  bumpLoad,
  toUnit,
  type HangKind,
  type TrendSummary,
  type WeightUnit,
} from "@sendtally/core/hang";
import { humanDuration, loadLabel, shortDate } from "@sendtally/features/hang";
import { formatNumber, t } from "@sendtally/features/i18n";
import type { Stat } from "../../components/StatGrid";

export type TrendContext = {
  workout: string;
  grip: string;
  kind: HangKind;
  unit: WeightUnit;
};

/** The latest completed load minus the first, in the display unit. */
export function changeOf(summary: TrendSummary, unit: WeightUnit): number {
  return toUnit(summary.last, unit) - toUnit(summary.first, unit);
}

export function insight(summary: TrendSummary, ctx: TrendContext): string {
  const load = (kg: number): string => loadLabel(ctx.kind, kg, ctx.unit);
  const change = changeOf(summary, ctx.unit);
  const line =
    change > 0
      ? summary.avgRpe === null
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
          })
      : t("hang.insightHeld", {
          load: load(summary.last),
          next: load(bumpLoad(ctx.kind, summary.last, ctx.unit, 1)),
        });
  const attempt = summary.topAttempt;
  return attempt === null
    ? line
    : `${line} ${t("hang.insightAttempt", { load: load(attempt.loadKg), date: shortDate(attempt.date), pct: attempt.pct })}`;
}

export function trendStats(
  series: readonly HangSessionRecord[],
  summary: TrendSummary,
  ctx: TrendContext
): Stat[] {
  const load = (kg: number): string => loadLabel(ctx.kind, kg, ctx.unit);
  const attempt = summary.topAttempt;
  return [
    { label: t("hang.statSessions"), value: String(series.length) },
    { label: t("hang.statBest"), value: load(summary.best) },
    {
      label: t("hang.statTopAttempt"),
      value:
        attempt === null
          ? "–"
          : t("hang.attemptValue", { load: load(attempt.loadKg), pct: attempt.pct }),
    },
    { label: t("hang.statAvgCompletion"), value: `${summary.avgPct}%` },
    {
      label: t("hang.statAvgEffort"),
      value:
        summary.avgRpe === null
          ? "–"
          : t("hang.effortOutOf", {
              value: formatNumber(summary.avgRpe, {
                maximumFractionDigits: 1,
                minimumFractionDigits: 1,
              }),
            }),
    },
    ctx.kind === "hang"
      ? { label: t("hang.statTimeOnEdge"), value: humanDuration(summary.work) }
      : { label: t("hang.lifts"), value: String(summary.work) },
  ];
}
