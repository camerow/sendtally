import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { useActivities, useWeightUnit } from "@sendtally/features/activities";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { durationLabel } from "@sendtally/features/sessions";
import { exerciseKey, useExerciseSeries } from "@sendtally/features/statistics";
import type { LibraryWorkout } from "@sendtally/features/workouts";
import { useApi } from "../../../lib/api";
import { pressRow } from "../../../lib/press";
import { ExerciseTrendCard } from "../exercises/ExerciseTrendCard";
import { Label } from "../components/Label";
import { type } from "../type";

const SHOWN = 5;

export type WorkoutRunsProps = { workout: LibraryWorkout };

/** How a workout is going: its lead exercise's best set over time, and its last runs. */
export function WorkoutRuns({ workout }: WorkoutRunsProps): React.ReactElement | null {
  const api = useApi();
  const activities = useActivities(api).state;
  const series = useExerciseSeries(api);
  const unit = useWeightUnit(api);
  const all =
    activities.status === "ready" ? activities.data.filter((a) => a.workoutId === workout.id) : [];
  const runs = all.slice(0, SHOWN);
  const names = workout.variations.flatMap((v) => v.items.map((i) => exerciseKey(i.exercise)));
  const lead =
    series.status === "ready"
      ? names.map((key) => series.data.find((s) => s.key === key)).find((s) => s !== undefined)
      : undefined;
  if (runs.length === 0 && lead === undefined) return null;
  return (
    <View style={{ gap: 16 }}>
      {lead !== undefined && <ExerciseTrendCard series={lead} chart="best" unit={unit} />}
      {runs.length > 0 && (
        <View style={{ gap: 4 }}>
          <Label color={colors.gunmetal}>
            {t("hang.history", { count: t("hang.sessionCount", { count: all.length }) })}
          </Label>
          {runs.map((a) => (
            <Pressable
              key={a.id}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: "/activity/[id]", params: { id: a.id } })}
              style={pressRow({
                minHeight: 44,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                borderBottomWidth: 1,
                borderColor: colors.lineOnLight,
              })}
            >
              <Text style={[type.mono, { width: 64, fontSize: 12, color: colors.textSecondary }]}>
                {shortDate(a.date)}
              </Text>
              <Text style={[type.bodyBold, { flex: 1, fontSize: 15, color: colors.gunmetal }]}>
                {a.title}
              </Text>
              <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
                {[durationLabel(a.minutes), ...(a.rpe === null ? [] : [`RPE ${a.rpe}`])].join(
                  " · "
                )}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
