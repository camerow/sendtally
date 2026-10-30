import React from "react";
import { ScrollView, Text, View } from "react-native";
import { fromUnit, toUnit, type ItemDone, type WeightUnit } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { climbsTotal, seriesPoint, setText } from "@sendtally/features/activities";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import {
  exerciseKey,
  isClimbingMetric,
  isGradeMetric,
  type ExerciseMetric,
  type ExerciseSeries,
} from "@sendtally/features/statistics";
import { Chip } from "../../../components/Chip";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { headlineLabel, metricText } from "../exercises/exerciseText";
import { SeriesChart } from "../trends/SeriesChart";
import { type } from "../type";
import { changeText } from "./summaryText";

export type OverTimeProps = {
  /** The series of the exercises this session did, in its order. */
  series: readonly ExerciseSeries[];
  activityId: string;
  /** What this session did, which a climbing exercise reads its sends from. */
  done: readonly ItemDone[];
  unit: WeightUnit;
};

const headerOf = (metric: ExerciseMetric): string =>
  metric === "sends"
    ? t("common.sent")
    : metric === "laps"
      ? t("summary.laps")
      : isGradeMetric(metric)
        ? headlineLabel(metric)
        : t("summary.bestSet");

/**
 * One exercise at a time: its best set per session, this session in gold. A climbing
 * exercise charts its sends per session, or its laps on the wall.
 */
export function OverTime({
  series,
  activityId,
  done,
  unit,
}: OverTimeProps): React.ReactElement | null {
  const [picked, setPicked] = React.useState(series[0]?.key);
  const shown = series.find((s) => s.key === picked) ?? series[0];
  const point = shown === undefined ? null : seriesPoint(shown, activityId);
  if (shown === undefined || point === null) return null;
  const at = shown.sessions[point.index];
  const load = shown.metric === "load";
  const text = (v: number): string =>
    metricText(load ? fromUnit(v, unit) : v, shown.metric, unit, shown.grades);
  const change = point.change === null ? null : changeText(point.change, unit);
  const first = shown.sessions[0];
  const climbs = climbsTotal(done.find((d) => exerciseKey(d.exercise) === shown.key)?.sets ?? []);
  const headline =
    shown.metric === "sends"
      ? t("summary.sentOf", { sent: climbs.sent, of: climbs.climbs })
      : shown.metric === "laps"
        ? t("tally.lapCount", { count: climbs.climbs })
        : at === undefined
          ? ""
          : isGradeMetric(shown.metric)
            ? metricText(at.value, shown.metric, unit, shown.grades)
            : setText(at.best, unit);

  return (
    <View style={{ gap: 12, paddingTop: 4 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Label color={colors.gunmetal}>{t("summary.overTime")}</Label>
        <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
          {headerOf(shown.metric)}
        </Text>
      </View>
      {series.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {series.map((s) => (
              <Chip
                key={s.key}
                label={s.name}
                active={s.key === shown.key}
                onPress={() => setPicked(s.key)}
              />
            ))}
          </View>
        </ScrollView>
      )}
      <View
        style={{
          gap: 8,
          padding: 14,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.lineOnLight,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Title size={24}>{headline}</Title>
            {isClimbingMetric(shown.metric) &&
              shown.metric !== "topGrade" &&
              climbs.top !== null && (
                <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
                  {t("sessions.topSend", { grade: climbs.top })}
                </Text>
              )}
          </View>
          {change !== null && (
            <Text style={[type.monoBold, { fontSize: 11.5, color: colors.fern }]}>
              {point.bestYet ? `${change} · ${t("summary.bestYet")}` : change}
            </Text>
          )}
        </View>
        {shown.sessions.length > 1 && (
          <SeriesChart
            values={shown.sessions.map((s) => (load ? toUnit(s.value, unit) : s.value))}
            hollow={shown.sessions.map(() => false)}
            air={load ? (unit === "lb" ? 4 : 2) : 1}
            edge={text}
            label={t("statistics.exerciseChart", {
              exercise: shown.name,
              from:
                first === undefined
                  ? ""
                  : metricText(first.value, shown.metric, unit, shown.grades),
              to: at === undefined ? "" : metricText(at.value, shown.metric, unit, shown.grades),
            })}
            seriesKey={shown.key}
            marked={point.index}
          />
        )}
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Label small color={colors.textSecondary}>
            {first === undefined ? "" : shortDate(first.date)}
          </Label>
          <Label small color={colors.gunmetal}>
            {at === undefined ? "" : shortDate(at.date)}
          </Label>
        </View>
      </View>
    </View>
  );
}
