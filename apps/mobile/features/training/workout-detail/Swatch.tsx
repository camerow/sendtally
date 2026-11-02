import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { type } from "../type";

/** A legend key: a colour mark and its label. */
export function Swatch({
  color,
  label,
  short,
}: {
  color: string;
  label: string;
  short?: boolean;
}): React.ReactElement {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      <View
        style={{ width: 10, height: short ? 4 : 10, borderRadius: 2, backgroundColor: color }}
      />
      <Text style={[type.body, { fontSize: 12, color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}
