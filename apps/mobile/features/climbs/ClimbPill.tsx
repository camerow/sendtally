import React from "react";
import { Text, View } from "react-native";
import type { ClimbPillKind } from "@sendtally/features/climbs";
import { colors, fonts } from "@sendtally/design/tokens";

const PILLS: Record<ClimbPillKind, { fill: string; ink: string; line?: string }> = {
  flash: { fill: colors.gold, ink: colors.gunmetal },
  onsight: { fill: "rgba(21,127,82,0.14)", ink: colors.fern },
  sent: { fill: colors.lineOnLightSoft, ink: colors.gunmetal },
  project: { fill: colors.gunmetal, ink: colors.gold },
  tries: { fill: "transparent", ink: colors.textSecondary, line: colors.lineOnLightStrong },
};

/** How a climb went, as a small status pill. */
export function ClimbPill({
  kind,
  label,
}: {
  kind: ClimbPillKind;
  label: string;
}): React.ReactElement {
  const look = PILLS[kind];
  return (
    <View
      style={{
        height: 24,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
        backgroundColor: look.fill,
        borderWidth: look.line === undefined ? 0 : 1,
        borderColor: look.line,
      }}
    >
      <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 12, color: look.ink }}>{label}</Text>
    </View>
  );
}
