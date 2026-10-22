import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import type { Weekday } from "@sendtally/core/hang";
import { weekdayLetters, weekdayLong } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { SheetSection } from "../components/SheetSection";
import { type } from "../type";
import type { Planner } from "./usePlanner";

export function DayToggles({ planner }: { planner: Planner }): React.ReactElement {
  return (
    <SheetSection label={t("hang.days")}>
      <View style={{ flexDirection: "row", gap: 5 }}>
        {weekdayLetters().map((letter, i) => {
          const day = i as Weekday;
          const on = planner.draft.days.includes(day);
          return (
            <Pressable
              key={i}
              onPress={() => planner.toggleDay(day)}
              accessibilityRole="checkbox"
              accessibilityLabel={weekdayLong(i)}
              accessibilityState={{ checked: on }}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: on ? colors.gunmetal : undefined,
                borderWidth: on ? 0 : 1,
                borderColor: colors.lineOnLightStrong,
              }}
            >
              <Text style={[type.label, { color: on ? colors.white : colors.gunmetal }]}>
                {letter}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SheetSection>
  );
}
