import { router } from "expo-router";
import React from "react";
import { Pressable, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { kindLabel, useWeightUnit } from "@sendtally/features/activities";
import { canCompareGrips } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import {
  exerciseByKey,
  useExercises,
  type ExerciseGroupKind,
  type ExerciseGroupVM,
} from "@sendtally/features/statistics";
import { useApi } from "../../../lib/api";
import { press } from "../../../lib/press";
import { HangIcon } from "../components/HangIcon";
import { Label } from "../components/Label";
import { useHangData } from "../data/HangDataContext";
import { KIND_LOOK } from "@sendtally/features/training";
import { ExerciseTrendRow } from "./ExerciseTrendRow";

/** Every exercise in range, grouped by kind, the most done first; each opens its trend, a grip its own screen. */
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
    if (kind === "hangboard")
      return () => router.push({ pathname: "/grip/[id]", params: { id: key } });
    const exercise = exercises.status === "ready" ? exerciseByKey(exercises.data, key) : undefined;
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
          {g.kind === "hangboard" ? (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Label small color={KIND_LOOK.hangboard.ink}>
                {kindLabel(g.kind)}
              </Label>
              {canCompareGrips(model.sessions) && (
                <Pressable
                  onPress={() => router.push("/grip/compare")}
                  accessibilityRole="button"
                  accessibilityLabel={t("hang.compareGrips")}
                  hitSlop={16}
                  style={press({ flexDirection: "row", alignItems: "center", gap: 4 })}
                >
                  <Label small color={colors.textSecondary}>
                    {t("hang.compare")}
                  </Label>
                  <HangIcon
                    name="forward"
                    color={colors.textSecondary}
                    size={12}
                    strokeWidth={2.2}
                  />
                </Pressable>
              )}
            </View>
          ) : (
            <Label small color={colors.textSecondary}>
              {kindLabel(g.kind)}
            </Label>
          )}
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
