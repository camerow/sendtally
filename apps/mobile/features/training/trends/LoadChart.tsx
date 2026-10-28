import React from "react";
import type { HangSessionRecord } from "@sendtally/api-client";
import { fromUnit, toUnit, type HangKind, type WeightUnit } from "@sendtally/core/hang";
import { loadLabel } from "@sendtally/features/hang";
import { SeriesChart } from "./SeriesChart";

export type LoadChartProps = {
  series: readonly HangSessionRecord[];
  kind: HangKind;
  unit: WeightUnit;
  label: string;
  /** The point drawn in gold: the best. */
  marked: number;
};

/** Load over time: filled dots for complete sessions, hollow ones for partials, the best in gold. */
export function LoadChart({
  series,
  kind,
  unit,
  label,
  marked,
}: LoadChartProps): React.ReactElement {
  return (
    <SeriesChart
      values={series.map((s) => toUnit(s.loadKg, unit))}
      hollow={series.map((s) => s.pct < 100)}
      air={unit === "lb" ? 4 : 2}
      edge={(value) => loadLabel(kind, fromUnit(value, unit), unit)}
      label={label}
      seriesKey={series[0]?.id ?? ""}
      marked={marked}
    />
  );
}
