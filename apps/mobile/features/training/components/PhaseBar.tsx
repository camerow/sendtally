import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { isWork, phasesFor, type Protocol } from "@sendtally/core/hang";

export type PhaseBarProps = { protocol: Protocol; height: number };

/** Work as tall blue segments, rest as short green ones, widths by duration. */
export function PhaseBar({ protocol, height }: PhaseBarProps): React.ReactElement {
  const phases = phasesFor(protocol).slice(1);
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
            backgroundColor: isWork(p.kind) ? colors.azure : colors.fern,
          }}
        />
      ))}
    </View>
  );
}
