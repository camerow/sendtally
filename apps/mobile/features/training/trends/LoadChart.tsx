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
};

/** Load over time: filled dots for complete sessions, hollow ones for partials, the latest in gold. */
export function LoadChart({ series, kind, unit, label }: LoadChartProps): React.ReactElement {
  return (
    <SeriesChart
      values={series.map((s) => toUnit(s.loadKg, unit))}
      hollow={series.map((s) => s.pct < 100)}
      air={unit === "lb" ? 4 : 2}
      edge={(value) => loadLabel(kind, fromUnit(value, unit), unit)}
      label={label}
      seriesKey={series[0]?.id ?? ""}
    />
  );
}
