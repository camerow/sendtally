import React from "react";
import { Pressable, Text } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { pressRow } from "../../../lib/press";
import { CheckBox } from "../components/CheckBox";
import { type } from "../type";

export type FoldedSetsCardProps = { name: string; sets: number; onOpen: () => void };

/** An exercise with every set ticked, folded to one line; tapping opens its sets again. */
export function FoldedSetsCard({ name, sets, onOpen }: FoldedSetsCardProps): React.ReactElement {
  const done = t("activities.setsDoneOf", { done: sets, count: sets });
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${done}`}
      style={pressRow({
        minHeight: 52,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
      })}
    >
      <Text style={[type.bodyBold, { flex: 1, fontSize: 16, color: colors.gunmetal }]}>{name}</Text>
      <Text style={[type.mono, { fontSize: 13, color: colors.textSecondary }]}>{done}</Text>
      <CheckBox checked color={colors.fern} />
    </Pressable>
  );
}
