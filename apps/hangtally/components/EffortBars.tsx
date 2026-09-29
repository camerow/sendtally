import React from "react";
import { Pressable, View } from "react-native";
import { effortColor } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { useTheme } from "../theme/ThemeContext";
import { rgba } from "../theme/themes";

export type EffortBarsProps = {
  value: number | null;
  onChange: (rpe: number) => void;
  surface: "dark" | "light";
};

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

/** Ten tappable bars, filled up to the chosen effort in its colour. */
export function EffortBars({ value, onChange, surface }: EffortBarsProps): React.ReactElement {
  const c = useTheme();
  const empty = surface === "dark" ? rgba(c.onDark, 0.14) : c.lineLight;
  return (
    <View style={{ flexDirection: "row", gap: 3 }}>
      {LEVELS.map((level) => (
        <Pressable
          key={level}
          onPress={() => onChange(level)}
          accessibilityRole="button"
          accessibilityLabel={t("common.effortValue", { n: level })}
          accessibilityState={{ selected: value === level }}
          hitSlop={{ top: 10, bottom: 10 }}
          style={{
            flex: 1,
            height: 26,
            borderRadius: 4,
            backgroundColor: value !== null && level <= value ? effortColor(value) : empty,
          }}
        />
      ))}
    </View>
  );
}
