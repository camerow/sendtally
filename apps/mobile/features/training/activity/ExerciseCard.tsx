import React from "react";
import { Pressable, Text, View } from "react-native";
import type { ItemDone, WeightUnit } from "@sendtally/core/hang";
import { colors, radius } from "@sendtally/design/tokens";
import { setChip } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { pressRow } from "../../../lib/press";
import { Button } from "../components/Button";
import { HangIcon } from "../components/HangIcon";
import { type } from "../type";

export type ExerciseCardProps = {
  done: ItemDone;
  unit: WeightUnit;
  /** Its sets to edit when open; folded, it reads as chips and opens on a tap. */
  editor: React.ReactNode | null;
  onOpen: () => void;
  onClose: () => void;
};

const card = {
  gap: 8,
  paddingVertical: 12,
  paddingHorizontal: 14,
  borderRadius: radius.card,
  borderWidth: 1,
  borderColor: colors.lineOnLightStrong,
} as const;

const name = [type.bodyBold, { flex: 1, fontSize: 16, color: colors.gunmetal }];

/** One exercise done: its name, how many sets and in what unit, and a chip per set. */
export function ExerciseCard({
  done,
  unit,
  editor,
  onOpen,
  onClose,
}: ExerciseCardProps): React.ReactElement {
  if (editor !== null) {
    return (
      <View style={[card, { gap: 2, borderWidth: 1.5, borderColor: colors.gunmetal }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={name}>{done.exercise}</Text>
          <Button label={t("common.done")} onPress={onClose} variant="link" height={36} />
        </View>
        {editor}
      </View>
    );
  }
  const weighted = done.sets.some((s) => s.weightKg);
  const count = t("activities.setCount", { count: done.sets.length });
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={t("activities.editSets", { exercise: done.exercise })}
      style={pressRow(card)}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Text style={name}>{done.exercise}</Text>
        <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
          {weighted ? `${count} · ${unit}` : count}
        </Text>
        <HangIcon name="edit" color={colors.textSecondary} size={16} strokeWidth={1.9} />
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {done.sets.map((set, i) => (
          <View
            key={i}
            style={{
              height: 28,
              paddingHorizontal: 9,
              borderRadius: 8,
              justifyContent: "center",
              backgroundColor: colors.surfaceSoft,
            }}
          >
            <Text style={[type.monoBold, { fontSize: 12.5, color: colors.gunmetal }]}>
              {setChip(set, unit) || "✓"}
            </Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}
