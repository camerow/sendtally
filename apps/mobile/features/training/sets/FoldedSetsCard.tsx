import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../../components/Icon";
import { pressRow } from "../../../lib/press";
import { CheckBox } from "../components/CheckBox";
import { type } from "../type";

export type FoldedSetsCardProps = {
  name: string;
  /** What it did, "5 × 5 · 135 lb", or that it was skipped. */
  line: string;
  /** Every set ticked: a tick in place of the chevron. */
  done: boolean;
  onOpen: () => void;
};

/** An exercise folded to one line: done with a tick, skipped, or folded from its title; a tap opens it. */
export function FoldedSetsCard({
  name,
  line,
  done,
  onOpen,
}: FoldedSetsCardProps): React.ReactElement {
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`${t("workouts.openExercise", { name })}, ${line}`}
      accessibilityState={{ expanded: false }}
      style={pressRow({
        minHeight: 60,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
      })}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.bodyBold, { fontSize: 16, color: colors.gunmetal }]}>{name}</Text>
        <Text style={[type.mono, { fontSize: 13, color: colors.textSecondary }]}>{line}</Text>
      </View>
      {done ? (
        <CheckBox checked color={colors.fern} />
      ) : (
        <View style={{ transform: [{ rotate: "90deg" }] }}>
          <Icon name="chevron" size={16} strokeWidth={2} color={colors.textMuted} />
        </View>
      )}
    </Pressable>
  );
}
