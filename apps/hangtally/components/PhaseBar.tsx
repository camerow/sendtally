import React from "react";
import { View } from "react-native";
import { isWork, phasesFor, phaseWeight, type Protocol } from "@sendtally/core/hang";
import { useTheme } from "../theme/ThemeContext";

export type PhaseBarProps = { protocol: Protocol; height: number };

/** Work as tall accent segments, rest as short rest-colour ones, widths by duration. */
export function PhaseBar({ protocol, height }: PhaseBarProps): React.ReactElement {
  const c = useTheme();
  const phases = phasesFor(protocol).slice(1);
  return (
    <View
      style={{ flex: 1, flexDirection: "row", alignItems: "flex-end", gap: 2, height }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {phases.map((p, i) => (
        <View
          key={i}
          style={{
            flexGrow: phaseWeight(p, protocol),
            flexBasis: 0,
            minWidth: 2,
            borderRadius: 2,
            height: isWork(p.kind) ? height : Math.round(height * 0.45),
            backgroundColor: isWork(p.kind) ? c.accent : c.rest,
          }}
        />
      ))}
    </View>
  );
}
