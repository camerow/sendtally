import React from "react";
import { Pressable, Text, View } from "react-native";
import type { Weekday } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { weekdayLetters, weekdayLong } from "@sendtally/features/hang";
import { type } from "../type";

export type WeekdayChipsProps = { days: readonly Weekday[]; onToggle: (day: Weekday) => void };

/** A chip per weekday, Monday first, each on or off. */
export function WeekdayChips({ days, onToggle }: WeekdayChipsProps): React.ReactElement {
  return (
    <View style={{ flexDirection: "row", gap: 5 }}>
      {weekdayLetters().map((letter, i) => {
        const day = i as Weekday;
        const on = days.includes(day);
        return (
          <Pressable
            key={i}
            onPress={() => onToggle(day)}
            accessibilityRole="checkbox"
            accessibilityLabel={weekdayLong(i)}
            accessibilityState={{ checked: on }}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 10,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: on ? colors.gunmetal : colors.surfaceSoft,
            }}
          >
            <Text style={[type.label, { color: on ? colors.white : colors.gunmetal }]}>
              {letter}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
