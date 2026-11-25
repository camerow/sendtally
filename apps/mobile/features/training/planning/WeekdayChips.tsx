import React from "react";
import { Pressable, Text, View } from "react-native";
import type { Weekday } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { weekdayLetters, weekdayLong } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { type } from "../type";

export type WeekdayChipsProps = {
  days: readonly Weekday[];
  onToggle: (day: Weekday) => void;
  /** Days drawn faint, still pressable. */
  dim?: readonly Weekday[];
  /** What the days are for, when chips for several things share a screen. */
  label?: string;
};

/** A chip per weekday, Monday first, each on or off. */
export function WeekdayChips({
  days,
  onToggle,
  dim = [],
  label,
}: WeekdayChipsProps): React.ReactElement {
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
            accessibilityLabel={
              label === undefined
                ? weekdayLong(i)
                : t("plan.dayOf", { name: label, day: weekdayLong(i) })
            }
            accessibilityState={{ checked: on }}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 10,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: on ? colors.gunmetal : colors.surfaceSoft,
              opacity: dim.includes(day) ? 0.35 : 1,
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
