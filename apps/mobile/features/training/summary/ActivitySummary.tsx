import { router } from "expo-router";
import React from "react";
import type { ActivityRecord } from "@sendtally/api-client";
import { colors } from "@sendtally/design/tokens";
import {
  exerciseResults,
  pastSessions,
  type ActivityActions,
} from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { exerciseKey, type ExerciseSeries } from "@sendtally/features/statistics";
import type { TrainingLog } from "@sendtally/features/training";
import type { WeightUnit } from "@sendtally/core/hang";
import { Label } from "../components/Label";
import { HistoryList } from "../history/HistoryList";
import { activityItem } from "../history/historyItems";
import { KIND_LOOK } from "../today/kindLook";
import { ExerciseResultCard } from "./ExerciseResultCard";
import { OverTime } from "./OverTime";
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
  const trends = done.flatMap((key) => series.filter((s) => s.key === key && s.untracked !== true));
  const sets = results.reduce((n, r) => n + r.sets.length, 0);
  const target = activity.workoutId === null ? null : log.workout(activity.workoutId);
  return (
    <SummaryFrame
      kicker={kickerText(activity.kind, activity.focus ?? null, activity.date, activity, log.plan)}
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
      <OverTime series={trends} activityId={activity.id} done={activity.done} unit={unit} />
      <HistoryList
        items={pastSessions(activity, activities).map((a) => activityItem(a, unit, activity.id))}
        onOpen={(id) => router.push({ pathname: "/activity/[id]", params: { id } })}
      />
    </SummaryFrame>
  );
}
