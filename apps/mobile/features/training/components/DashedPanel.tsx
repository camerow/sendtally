import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { type } from "../type";

/** An empty state: a dashed outline around a line or two. */
export function DashedPanel({ body }: { body: string }): React.ReactElement {
  return (
    <View
      style={{
        padding: 18,
        borderRadius: 16,
        borderWidth: 1.5,
        borderStyle: "dashed",
        borderColor: "rgba(64,63,76,0.24)",
      }}
    >
      <Text style={[type.body, { fontSize: 14, lineHeight: 21, color: colors.textSecondary }]}>
        {body}
      </Text>
    </View>
  );
}
