import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { type } from "../type";
import { Label } from "./Label";

export type DashedPanelProps = { title?: string; body: string };

/** An empty state: a dashed outline around a line or two, under an optional label. */
export function DashedPanel({ title, body }: DashedPanelProps): React.ReactElement {
  return (
    <View
      style={{
        gap: 6,
        padding: 18,
        borderRadius: 16,
        borderWidth: 1.5,
        borderStyle: "dashed",
        borderColor: "rgba(64,63,76,0.24)",
      }}
    >
      {title !== undefined && <Label color={colors.petalInk}>{title}</Label>}
      <Text style={[type.body, { fontSize: 14, lineHeight: 21, color: colors.textSecondary }]}>
        {body}
      </Text>
    </View>
  );
}
