import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { type } from "../type";

export type RestDividerProps = { label: string };

const dash = {
  flex: 1,
  height: 0,
  borderTopWidth: 1.5,
  borderStyle: "dashed",
  borderColor: colors.lineOnLightStrong,
} as const;

/** The rest between two exercises, where it falls: a dashed rule with its time. */
export function RestDivider({ label }: RestDividerProps): React.ReactElement {
  return (
    <View style={{ minHeight: 34, flexDirection: "row", alignItems: "center", gap: 8 }}>
      <View style={dash} />
      <Text style={[type.mono, { fontSize: 12, color: colors.textMuted }]}>{label}</Text>
      <View style={dash} />
    </View>
  );
}
