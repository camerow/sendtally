import React from "react";
import type { ActivityRecord } from "@sendtally/api-client";
import { colors } from "@sendtally/design/tokens";
import {
  bestSet,
  exerciseResults,
  pastSessions,
  setText,
  type ActivityActions,
} from "@sendtally/features/activities";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { exerciseKey, type ExerciseSeries } from "@sendtally/features/statistics";
import type { TrainingLog } from "@sendtally/features/training";
import type { WeightUnit } from "@sendtally/core/hang";
import { Label } from "../components/Label";
import { KIND_LOOK } from "../today/kindLook";
import { ExerciseResultCard } from "./ExerciseResultCard";
import { OverTime } from "./OverTime";
import { PastSessions, type PastSessionRow } from "./PastSessions";
import { SummaryFrame } from "./SummaryFrame";
import { effortTile, kickerText } from "./summaryText";

export type ActivitySummaryProps = {
  activity: ActivityRecord;
  activities: readonly ActivityRecord[];
  series: readonly ExerciseSeries[];
  log: TrainingLog;
  unit: WeightUnit;
  actions: ActivityActions;
};

function pastRow(a: ActivityRecord, current: string, unit: WeightUnit): PastSessionRow {
  const first = a.done.find((d) => d.sets.length > 0);
  const best = first === undefined ? undefined : bestSet(first.sets);
  const lead =
    first === undefined || best === undefined ? [] : [`${first.exercise} ${setText(best, unit)}`];
  return {
    id: a.id,
    date: shortDate(a.date),
    meta: [...lead, t("hang.minutes", { n: a.minutes })].join(" · "),
    effort: a.rpe === null ? null : `RPE ${a.rpe}`,
    current: a.id === current,
  };
}

/** A finished strength, mobility or other workout: each exercise, over time, and its past sessions. */
export function ActivitySummary({
  activity,
  activities,
  series,
  log,
  unit,
  actions,
}: ActivitySummaryProps): React.ReactElement {
  const results = exerciseResults(activity, activities);
  const done = results.map((r) => exerciseKey(r.exercise));
  const trends = done.flatMap((key) => series.filter((s) => s.key === key));
  const sets = results.reduce((n, r) => n + r.sets.length, 0);
  const target = activity.workoutId === null ? null : log.workout(activity.workoutId);
  return (
    <SummaryFrame
      kicker={kickerText(activity.kind, activity.date, activity, log.plan)}
      kickerColor={KIND_LOOK[activity.kind].ink}
      title={activity.title}
      tiles={[
        { value: t("hang.minutes", { n: activity.minutes }), label: t("summary.length") },
        effortTile(activity.rpe, target?.targetRpe ?? null),
        { value: String(sets), label: t("summary.sets") },
      ]}
      target={{ kind: "activity", record: activity }}
      rpe={activity.rpe}
      onDelete={() => void actions.deleteActivity(activity.id)}
    >
      {results.length > 0 && (
        <Label color={colors.textSecondary} style={{ paddingTop: 4 }}>
          {t("summary.whatYouDid")}
        </Label>
      )}
      {results.map((r) => (
        <ExerciseResultCard key={r.exercise} result={r} unit={unit} />
      ))}
      <OverTime series={trends} activityId={activity.id} unit={unit} />
      <PastSessions
        rows={pastSessions(activity, activities).map((a) => pastRow(a, activity.id, unit))}
      />
    </SummaryFrame>
  );
}
