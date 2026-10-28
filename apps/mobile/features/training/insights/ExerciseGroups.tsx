import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import { byDate } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { useWeightUnit } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import {
  exerciseKey,
  kindName,
  useExercises,
  type ExerciseGroupKind,
  type ExerciseGroupVM,
} from "@sendtally/features/statistics";
import { useApi } from "../../../lib/api";
import { Label } from "../components/Label";
import { useHangData } from "../data/HangDataContext";
import { ExerciseTrendRow } from "./ExerciseTrendRow";

/** Every exercise in range, grouped by kind, the most done first; each opens its trend over time. */
export function ExerciseGroups({
  groups,
}: {
  groups: ExerciseGroupVM[];
}): React.ReactElement | null {
  const api = useApi();
  const unit = useWeightUnit(api);
  const exercises = useExercises(api).state;
  const { model } = useHangData();
  if (groups.length === 0) return null;

  const openOf = (kind: ExerciseGroupKind, key: string): (() => void) | undefined => {
    if (kind === "hangboard") {
      const last = model.sessions
        .filter((s) => s.gripId === key)
        .sort(byDate)
        .at(-1);
      return last === undefined
        ? undefined
        : () =>
            router.push({ pathname: "/workout/[id]", params: { id: last.workoutId, grip: key } });
    }
    const exercise =
      exercises.status === "ready"
        ? exercises.data.find((e) => exerciseKey(e.name) === key)
        : undefined;
    return exercise === undefined
      ? undefined
      : () => router.push({ pathname: "/exercise/[id]", params: { id: exercise.id } });
  };

  return (
    <View style={{ gap: 12 }}>
      <Label color={colors.gunmetal} style={{ paddingTop: 2 }}>
        {t("statistics.exercisesMostDone")}
      </Label>
      {groups.map((g) => (
        <View key={g.kind}>
          <Label small color={colors.textSecondary}>
            {kindName(g.kind)}
          </Label>
          {g.rows.map((row) => (
            <ExerciseTrendRow
              key={row.key}
              row={row}
              unit={unit}
              onPress={openOf(g.kind, row.key)}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
