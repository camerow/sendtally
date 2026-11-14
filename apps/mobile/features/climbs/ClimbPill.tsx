import React from "react";
import { Text, View } from "react-native";
import type { ClimbPillKind } from "@sendtally/features/climbs";
import { climbPills, fonts } from "@sendtally/design/tokens";

const PILLS: Record<ClimbPillKind, { fill: string; ink: string; line?: string }> = climbPills;

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
