import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { type } from "../type";

/** A filled dot for complete sessions, a ring for partial ones. */
export function Legend({ ring, label }: { ring: boolean; label: string }): React.ReactElement {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View
        style={{
          width: 9,
          height: 9,
          borderRadius: 5,
          backgroundColor: ring ? undefined : colors.gunmetal,
          borderWidth: ring ? 2 : 0,
          borderColor: colors.gunmetal,
        }}
      />
      <Text style={[type.body, { fontSize: 12, color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}
