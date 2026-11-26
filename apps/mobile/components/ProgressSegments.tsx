import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";

export type ProgressSegmentsProps = {
  total: number;
  /** Segments filled from the start. */
  n: number;
  /** Gold on the app's dark ground. */
  dark?: boolean;
  /** Read as a progress bar when given; without one the segments are hidden from screen readers. */
  label?: string;
};

/** The first-run wizard's progress: a thin segment a step, filled through the one shown. */
export function ProgressSegments({
  total,
  n,
  dark = false,
  label,
}: ProgressSegmentsProps): React.ReactElement {
  const spoken = label !== undefined;
  return (
    <View
      accessible={spoken && total > 0}
      {...(spoken
        ? { accessibilityRole: "progressbar" as const, accessibilityLabel: label }
        : {
            accessibilityElementsHidden: true,
            importantForAccessibility: "no-hide-descendants" as const,
          })}
      style={{ flexDirection: "row", gap: 4 }}
    >
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            backgroundColor:
              i < n
                ? dark
                  ? colors.gold
                  : colors.gunmetal
                : dark
                  ? "rgba(255,255,255,0.18)"
                  : colors.dataBarEmpty,
          }}
        />
      ))}
    </View>
  );
}
