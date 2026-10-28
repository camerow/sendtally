import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
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
import { Button } from "../components/Button";
import { KIND_LOOK } from "../today/kindLook";
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
  if (groups.length === 0) return null;

  const openOf = (kind: ExerciseGroupKind, key: string): (() => void) | undefined => {
    if (kind === "hangboard")
      return () => router.push({ pathname: "/grip/[id]", params: { id: key } });
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
          {g.kind === "hangboard" ? (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Label small color={KIND_LOOK.hangboard.ink}>
                {kindName(g.kind)}
              </Label>
              <Button
                label={t("hang.compareGrips")}
                onPress={() => router.push("/grip/compare")}
                variant="link"
                height={44}
                style={{ marginVertical: -10 }}
              />
            </View>
          ) : (
            <Label small color={colors.textSecondary}>
              {kindName(g.kind)}
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
