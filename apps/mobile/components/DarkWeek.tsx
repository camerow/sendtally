import React from "react";
import { Text, View } from "react-native";
import type { Weekday, WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { weekdayLetters } from "@sendtally/features/hang";
import { DayMark } from "../features/training/today/DayMark";
import { darkMeta } from "../features/first-run/components/DarkCard";

/** Seven days on the dark ground, Monday first: lit where training lands, with each workout's mark. */
export function DarkWeek({
  week,
}: {
  week: readonly (readonly WorkoutKind[] | null)[];
}): React.ReactElement {
  const letters = weekdayLetters();
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {week.map((kinds, i) => (
        <View key={i} style={{ flex: 1, alignItems: "center", gap: 6 }}>
          <View
            style={{
              width: "100%",
              height: 40,
              borderRadius: 10,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              backgroundColor: kinds === null ? "rgba(255,255,255,0.07)" : "rgba(249,220,92,0.18)",
              borderWidth: kinds === null ? 0 : 1.5,
              borderColor: colors.gold,
            }}
          >
            {kinds?.map((k, j) => (
              <DayMark key={j} kind={k} filled onDark />
            ))}
          </View>
          <Text style={{ ...darkMeta, fontSize: 10 }}>{letters[i as Weekday]}</Text>
        </View>
      ))}
    </View>
  );
}
