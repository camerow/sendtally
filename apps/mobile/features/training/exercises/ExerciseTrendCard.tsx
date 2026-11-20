import React from "react";
import { Text, View } from "react-native";
import { fromUnit, toUnit, type WeightUnit, chartAir } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { shortDate, weightText } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import type {
  ExerciseMetric,
  ExerciseSeries,
  ExerciseSession,
} from "@sendtally/features/statistics";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { Legend } from "../trends/Legend";
import { SeriesChart } from "../trends/SeriesChart";
import { type } from "../type";
import { headlineLabel, metricText, volumeLine } from "@sendtally/features/exercises";
import type { ExerciseChartMetric } from "./types";

export type ExerciseTrendCardProps = {
  series: ExerciseSeries;
  chart: ExerciseChartMetric;
  unit: WeightUnit;
};

type Point = { session: ExerciseSession; value: number };

const AIR = {
  load: 2,
  seconds: 5,
  reps: 1,
  sends: 1,
  laps: 1,
  averageGrade: 1,
  topGrade: 1,
  volume: 2,
} as const satisfies Record<ExerciseMetric, number>;

/** One exercise over time: the best set per session, or the estimated one-rep max. */
export function ExerciseTrendCard({
  series,
  chart,
  unit,
}: ExerciseTrendCardProps): React.ReactElement {
  const points: Point[] =
    chart === "e1rm"
      ? series.sessions.flatMap((s) => (s.e1rmKg === null ? [] : [{ session: s, value: s.e1rmKg }]))
      : series.sessions.map((s) => ({ session: s, value: s.value }));
  const load = chart === "e1rm" || series.metric === "load";
  const text = (v: number): string =>
    load ? weightText(v, unit) : metricText(v, series.metric, unit, series.grades);
  const shown = (v: number): number => (load ? toUnit(v, unit) : v);
  const fromShown = (v: number): number => (load ? fromUnit(v, unit) : v);
  const latest = points.at(-1);
  const first = points[0];
  const made = latest === undefined ? null : volumeLine(latest.session, series.grades);
  return (
    <View
      style={{
        gap: 12,
        padding: 16,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.lineOnLight,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Label color={colors.gunmetal}>
          {chart === "e1rm" ? t("statistics.e1rmBest") : headlineLabel(series.metric)}
        </Label>
        <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
          {series.name}
        </Text>
      </View>
      {latest !== undefined && <Title size={40}>{text(latest.value)}</Title>}
      {made !== null && (
        <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>{made}</Text>
      )}
      {first !== undefined && latest !== undefined && (
        <SeriesChart
          values={points.map((p) => shown(p.value))}
          hollow={points.map(() => false)}
          air={load ? chartAir(unit) : AIR[series.metric]}
          edge={(v) => text(fromShown(v))}
          label={t("statistics.exerciseChart", {
            exercise: series.name,
            from: text(first.value),
            to: text(latest.value),
          })}
          seriesKey={`${series.key}:${chart}`}
        />
      )}
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Label small color={colors.textSecondary}>
          {first === undefined ? "" : shortDate(first.session.date)}
        </Label>
        <Label small color={colors.textSecondary}>
          {t("statistics.exerciseSessions", { count: points.length })}
        </Label>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
        <Legend ring={false} label={t("statistics.legendDone")} />
      </View>
    </View>
  );
}
