import React from "react";
import { Pressable, Text } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { pressRow } from "../../../lib/press";
import { type } from "../type";

export type PreviewRowProps = { title: string; detail: string; onPress?: () => void };

/** One line of a workout's body: what to do, and how much in mono. */
export function PreviewRow({ title, detail, onPress }: PreviewRowProps): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      disabled={onPress === undefined}
      accessibilityRole={onPress === undefined ? undefined : "button"}
      style={pressRow({
        gap: 3,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.lineOnLightSoft,
      })}
    >
      <Text style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>{title}</Text>
      {detail !== "" && (
        <Text style={[type.mono, { fontSize: 12, lineHeight: 18, color: colors.textSecondary }]}>
          {detail}
        </Text>
      )}
    </Pressable>
  );
}
