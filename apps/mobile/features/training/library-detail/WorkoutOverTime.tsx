import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { useWeightUnit } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { exerciseKey, useExerciseSeries } from "@sendtally/features/statistics";
import type { LibraryWorkout } from "@sendtally/features/workouts";
import { LinkRow } from "../../../components/LinkRow";
import { useApi } from "../../../lib/api";
import { Label } from "../components/Label";
import { useHangData } from "../data/HangDataContext";
import { ExerciseTrendCard } from "../exercises/ExerciseTrendCard";

export type WorkoutOverTimeProps = {
  workout: LibraryWorkout;
  /** The grip a hangboard workout runs on, whose progress it links to. */
  gripId: string | null;
};

/** How a workout is going: its grip's progress on a hangboard, else its lead exercise's best set. */
export function WorkoutOverTime({
  workout,
  gripId,
}: WorkoutOverTimeProps): React.ReactElement | null {
  const api = useApi();
  const { model } = useHangData();
  const series = useExerciseSeries(api);
  const unit = useWeightUnit(api);
  const lead =
    series.status === "ready"
      ? workout.items
          .map((i) =>
            series.data.find((s) => s.key === exerciseKey(i.exercise) && s.untracked !== true)
          )
          .find((s) => s !== undefined)
      : undefined;
  const body =
    gripId !== null && model.sessions.some((s) => s.gripId === gripId) ? (
      <LinkRow
        label={t("hang.gripProgress", { grip: model.gripName(gripId) })}
        onPress={() => router.push({ pathname: "/grip/[id]", params: { id: gripId } })}
      />
    ) : gripId === null && lead !== undefined ? (
      <ExerciseTrendCard series={lead} chart="best" unit={unit} />
    ) : null;
  if (body === null) return null;
  return (
    <View style={{ gap: 8 }}>
      <Label color={colors.gunmetal}>{t("summary.overTime")}</Label>
      {body}
    </View>
  );
}
