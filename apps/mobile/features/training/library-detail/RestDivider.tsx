import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { DashedRule } from "../components/DashedRule";
import { type } from "../type";

export type RestDividerProps = { label: string };

/** The rest between two exercises, where it falls: a dashed rule with its time. */
export function RestDivider({ label }: RestDividerProps): React.ReactElement {
  return (
    <View style={{ minHeight: 34, flexDirection: "row", alignItems: "center", gap: 8 }}>
      <DashedRule />
      <Text style={[type.mono, { fontSize: 12, color: colors.textMuted }]}>{label}</Text>
      <DashedRule />
    </View>
  );
}
