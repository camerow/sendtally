import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { intervalPhases, isWork, type Intervals } from "@sendtally/core/hang";

export type IntervalsBarProps = { intervals: Intervals; height: number };

/** An intervals run drawn like a hangboard phase bar: work tall, rest short, widths by duration. */
export function IntervalsBar({ intervals, height }: IntervalsBarProps): React.ReactElement {
  const phases = intervalPhases(intervals).slice(1);
  return (
    <View
      style={{ flex: 1, flexDirection: "row", alignItems: "flex-end", gap: 1, height }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {phases.map((p, i) => (
        <View
          key={i}
          style={{
            flexGrow: p.seconds,
            flexBasis: 0,
            minWidth: 1,
            borderRadius: 1,
            height: isWork(p.kind) ? height : Math.round(height * 0.42),
            backgroundColor: isWork(p.kind) ? colors.gunmetal : colors.petal,
          }}
        />
      ))}
    </View>
  );
}
