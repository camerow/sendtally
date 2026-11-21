import React from "react";
import { Pressable, Text, View, type ViewStyle } from "react-native";
import type { Weekday, WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { weekdayLetters, weekdayLong } from "@sendtally/features/hang";
import { press } from "../lib/press";
import { DayMark } from "../features/training/today/DayMark";
import { darkMeta } from "../features/first-run/components/DarkCard";

/** Seven days on the dark ground, Monday first: lit where training lands, with each workout's mark. With `onToggle`, each day is the control that turns it on and off. */
export function DarkWeek({
  week,
  onToggle,
}: {
  week: readonly (readonly WorkoutKind[] | null)[];
  onToggle?: (day: Weekday) => void;
}): React.ReactElement {
  const letters = weekdayLetters();
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {week.map((kinds, i) => (
        <View key={i} style={{ flex: 1, alignItems: "center", gap: 6 }}>
          {onToggle === undefined ? (
            <View style={cell(kinds !== null)}>
              {kinds?.map((k, j) => (
                <DayMark key={j} kind={k} filled onDark />
              ))}
            </View>
          ) : (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityLabel={weekdayLong(i)}
              accessibilityState={{ checked: kinds !== null }}
              hitSlop={4}
              onPress={() => onToggle(i as Weekday)}
              style={press([cell(kinds !== null), { height: 46 }])}
            >
              {kinds?.map((k, j) => (
                <DayMark key={j} kind={k} filled onDark />
              ))}
            </Pressable>
          )}
          <Text style={{ ...darkMeta, fontSize: 10 }}>{letters[i as Weekday]}</Text>
        </View>
      ))}
    </View>
  );
}

const cell = (on: boolean): ViewStyle => ({
  width: "100%",
  height: 40,
  borderRadius: 10,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 3,
  backgroundColor: on ? "rgba(249,220,92,0.18)" : "rgba(255,255,255,0.07)",
  borderWidth: on ? 1.5 : 0,
  borderColor: colors.gold,
});
