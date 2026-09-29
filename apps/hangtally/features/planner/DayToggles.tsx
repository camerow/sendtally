import React from "react";
import { Pressable, Text, View } from "react-native";
import type { Weekday } from "@sendtally/core/hang";
import { weekdayLetters, weekdayLong } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { SheetSection } from "../../components/SheetSection";
import { useTheme } from "../../theme/ThemeContext";
import { type } from "../../theme/type";
import type { Planner } from "./usePlanner";

export function DayToggles({ planner }: { planner: Planner }): React.ReactElement {
  const c = useTheme();
  return (
    <SheetSection label={t("hang.days")}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
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
                width: 44,
                height: 44,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: on ? c.ink : undefined,
                borderWidth: on ? 0 : 1,
                borderColor: c.lineLight,
              }}
            >
              <Text style={[type.monoBold, { fontSize: 15, color: on ? c.card : c.ink2 }]}>
                {letter}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SheetSection>
  );
}
