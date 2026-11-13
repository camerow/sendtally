import type { WeightUnit } from "@sendtally/core/hang";
import { metricText } from "../exercises/exerciseText";
import { KIND_COLORS } from "../training/kindColors";
import { plot, type Point } from "./chartGeometry";
import { focusColor } from "./focusColors";
import type { ExerciseTrendVM, InsightsPointVM, TrainedFocusVM, TrainedKindVM } from "./insights";
import { focusKey, type TrainedBy } from "./workouts";

export type MixRowVM = { key: string; name: string; share: number; detail: string; color: string };

/** What was trained, by category or by focus, each with the key it filters by and its colour. */
export function mixRows(
  data: { trained: TrainedKindVM[]; byFocus: TrainedFocusVM[] },
  by: TrainedBy
): MixRowVM[] {
  return by === "category"
    ? data.trained.map((k) => ({ ...k, key: k.kind, color: KIND_COLORS[k.kind] }))
    : data.byFocus.map((f) => ({ ...f, key: focusKey(f.focus), color: focusColor(f.focus) }));
}

/** "+6 kg": the change since the first time in range, in what the exercise is measured in; nothing when it did not move. */
export function trendChange(row: ExerciseTrendVM, unit: WeightUnit): string {
  if (row.change === 0 || row.count < 2) return "";
  return `${row.change < 0 ? "−" : "+"}${metricText(Math.abs(row.change), row.metric, unit)}`;
}

export const SPARK_WIDTH = 34;
export const SPARK_HEIGHT = 20;

/** The last six values as a sparkline, a flat run drawn across the middle. */
export function sparkPoints(all: readonly number[]): Point[] {
  const values = all.slice(-6);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const flat = lo === hi;
  return plot(values, flat ? lo - 1 : lo, flat ? hi + 1 : hi, SPARK_WIDTH, SPARK_HEIGHT, 3);
}

/** Effort out of 10, or sessions against the busiest bucket, in the box; a bucket with no effort is skipped. */
export function insightsLine(
  points: readonly InsightsPointVM[],
  key: "effort" | "sessions",
  width: number,
  height: number,
  pad: number
): Point[] {
  const most = Math.max(1, ...points.map((p) => p.sessions));
  const x = (i: number): number =>
    pad + (width - pad * 2) * (points.length > 1 ? i / (points.length - 1) : 0.5);
  return points.flatMap((p, i): Point[] => {
    const share = key === "effort" ? (p.effort === null ? null : p.effort / 10) : p.sessions / most;
    return share === null ? [] : [[x(i), pad + (height - pad * 2) * (1 - share)]];
  });
}
