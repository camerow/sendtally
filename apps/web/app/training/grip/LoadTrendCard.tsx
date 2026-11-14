import React from "react";
import type { HangSessionRecord } from "@sendtally/api-client";
import {
  fromUnit,
  toUnit,
  type HangKind,
  type TrendSummary,
  type WeightUnit,
} from "@sendtally/core/hang";
import { bestIndex, changeOf, dayMonth, loadLabel } from "@sendtally/features/hang";
import { formatNumber, t } from "@sendtally/features/i18n";
import { EffortLine } from "../components/EffortLine";
import { SeriesChart } from "../components/SeriesChart";

export type LoadTrendCardProps = {
  /** What the chart is read out as. */
  name: string;
  /** Top right: the setup the series ran on. */
  caption: string;
  series: readonly HangSessionRecord[];
  summary: TrendSummary;
  kind: HangKind;
  unit: WeightUnit;
};

/**
 * Completed load over a series: the latest and its change, partials as rings, the best in gold.
 * Before any session is complete it leads with the latest attempt, drawn as a ring.
 */
export function LoadTrendCard({
  name,
  caption,
  series,
  summary,
  kind,
  unit,
}: LoadTrendCardProps): React.ReactElement {
  const change = changeOf(summary, unit);
  const load = (kg: number): string => loadLabel(kind, kg, unit);
  const first = series[0];
  const attempting = summary.best === null;
  const headline = attempting
    ? t("hang.latestAttempt")
    : kind === "hang"
      ? t("hang.addedLoadCompleted")
      : t("hang.weightCompleted");
  return (
    <div className="trend-card">
      <div className="trend-card-head">
        <span className="train-label">{headline}</span>
        <span className="trend-card-name">{caption}</span>
      </div>
      <div className="trend-card-headline">
        {attempting && <span className="trend-ring" aria-hidden="true" />}
        <span className="train-title trend-card-value">{load(summary.last ?? summary.latest)}</span>
        {summary.completed > 1 && change !== 0 && (
          <span className="train-label trend-delta">
            {t("hang.delta", {
              arrow: change > 0 ? "▲" : "▼",
              value: formatNumber(Math.abs(change)),
              unit,
            })}
          </span>
        )}
      </div>
      <SeriesChart
        values={series.map((s) => toUnit(s.loadKg, unit))}
        hollow={series.map((s) => s.pct < 100)}
        air={unit === "lb" ? 4 : 2}
        edge={(v) => loadLabel(kind, fromUnit(v, unit), unit)}
        marked={bestIndex(series, summary)}
        label={t("hang.chartAria", {
          workout: name,
          from: load(summary.first ?? first?.loadKg ?? summary.latest),
          to: load(summary.last ?? summary.latest),
        })}
      />
      <div className="trend-card-foot train-label">
        <span>{first === undefined ? "" : dayMonth(first.date)}</span>
        <span>{t("hang.allSessionsLatest", { count: series.length })}</span>
      </div>
      <span className="trend-legends">
        <span className="trend-legend">{t("hang.legendCompleted")}</span>
        <span className="trend-legend trend-legend--ring">{t("hang.legendPartial")}</span>
      </span>
      <EffortLine rpes={series.map((s) => s.rpe)} />
    </div>
  );
}
