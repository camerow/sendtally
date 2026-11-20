import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { weekdayLetters } from "@sendtally/features/hang";
import { SAMPLE_WEEK } from "@sendtally/features/settings";
import { Label } from "../../components/Label";
import { DayCell } from "../../plan/DayCell";

/** A training week, for the plan path's card. */
export function WeekArt(): React.ReactElement {
  const letters = weekdayLetters();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      {SAMPLE_WEEK.map((kind, i) => (
        <View key={i} style={{ alignItems: "center", gap: 6 }}>
          <DayCell kind={kind ?? "strength"} on={kind !== null} size={32} />
          <Label small color={colors.textSecondary}>
            {letters[i]}
          </Label>
        </View>
      ))}
    </View>
  );
}
