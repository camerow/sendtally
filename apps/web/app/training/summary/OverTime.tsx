import React from "react";
import { fromUnit, toUnit, type ItemDone, type WeightUnit } from "@sendtally/core/hang";
import { changeText, climbsTotal, seriesPoint, setText } from "@sendtally/features/activities";
import { headlineLabel, metricText } from "@sendtally/features/exercises";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import {
  exerciseKey,
  isClimbingMetric,
  isGradeMetric,
  type ExerciseMetric,
  type ExerciseSeries,
} from "@sendtally/features/statistics";
import { chipStyle } from "../../components/chip";
import { SeriesChart } from "../components/SeriesChart";

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
    <section className="detail-section over-time">
      <div className="trend-card-head">
        <h2 className="detail-label">{t("summary.overTime")}</h2>
        <span className="trend-card-name">{headerOf(shown.metric)}</span>
      </div>
      {series.length > 1 && (
        <div className="setup-chips">
          {series.map((s) => (
            <button
              key={s.key}
              type="button"
              aria-pressed={s.key === shown.key}
              style={chipStyle(s.key === shown.key, { minHeight: 40 })}
              onClick={() => setPicked(s.key)}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
      <div className="trend-card">
        <div className="trend-card-head">
          <span className="over-time-headline">
            <span className="train-title over-time-value">{headline}</span>
            {isClimbingMetric(shown.metric) &&
              shown.metric !== "topGrade" &&
              climbs.top !== null && (
                <span className="trend-card-name">
                  {t("sessions.topSend", { grade: climbs.top })}
                </span>
              )}
          </span>
          {change !== null && (
            <span className="result-change result-change--up">
              {point.bestYet ? `${change} · ${t("summary.bestYet")}` : change}
            </span>
          )}
        </div>
        {shown.sessions.length > 1 && (
          <SeriesChart
            values={shown.sessions.map((s) => (load ? toUnit(s.value, unit) : s.value))}
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
            marked={point.index}
          />
        )}
        <div className="trend-card-foot train-label">
          <span>{first === undefined ? "" : shortDate(first.date)}</span>
          <span style={{ color: "var(--bs-gunmetal)" }}>
            {at === undefined ? "" : shortDate(at.date)}
          </span>
        </div>
      </div>
    </section>
  );
}
