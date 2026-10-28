import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { useWeightUnit } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { kindName, type ExerciseGroupVM } from "@sendtally/features/statistics";
import { useApi } from "../../../lib/api";
import { Label } from "../components/Label";
import { ExerciseTrendRow } from "./ExerciseTrendRow";

/** Every exercise in range, grouped by kind, the most done first. */
export function ExerciseGroups({
  groups,
}: {
  groups: ExerciseGroupVM[];
}): React.ReactElement | null {
  const unit = useWeightUnit(useApi());
  if (groups.length === 0) return null;
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
            <ExerciseTrendRow key={row.key} row={row} unit={unit} />
          ))}
        </View>
      ))}
    </View>
  );
}
