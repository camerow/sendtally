import React from "react";
import { Pressable, View } from "react-native";
import { colors, effortColor } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";

export type EffortBarsProps = { value: number | null; onChange: (rpe: number) => void };

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
const TALLEST = 52;

/** Ten tappable bars rising with effort, filled up to the chosen one in its colour. */
export function EffortBars({ value, onChange }: EffortBarsProps): React.ReactElement {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 4, height: TALLEST }}>
      {LEVELS.map((level) => (
        <Pressable
          key={level}
          onPress={() => onChange(level)}
          accessibilityRole="button"
          accessibilityLabel={t("common.effortValue", { n: level })}
          accessibilityState={{ selected: value === level }}
          style={{ flex: 1, height: TALLEST, justifyContent: "flex-end" }}
        >
          <View
            style={{
              height: 14 + (level - 1) * ((TALLEST - 14) / 9),
              borderRadius: 4,
              backgroundColor:
                value !== null && level <= value ? effortColor(value) : colors.dataBarEmpty,
            }}
          />
        </Pressable>
      ))}
    </View>
  );
}
