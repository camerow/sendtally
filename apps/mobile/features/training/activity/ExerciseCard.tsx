import React from "react";
import { Pressable, Text, View } from "react-native";
import type { ItemDone, WeightUnit } from "@sendtally/core/hang";
import { colors, radius } from "@sendtally/design/tokens";
import { setChip } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { press } from "../../../lib/press";
import { Button } from "../components/Button";
import { HangIcon } from "../components/HangIcon";
import { type } from "../type";
import { SetChip } from "./SetChip";

export type ExerciseCardProps = {
  done: ItemDone;
  unit: WeightUnit;
  /** The kind's colour, on the mark beside its name. */
  color: string;
  /** Its sets to edit when open; folded, it reads as chips to tick, and the pencil opens it. */
  editor: React.ReactNode | null;
  isOn: (set: number) => boolean;
  shortOf: (set: number) => string | null;
  onToggle: (set: number) => void;
  onOpen: () => void;
  onClose: () => void;
};

const card = {
  gap: 8,
  paddingVertical: 12,
  paddingHorizontal: 14,
  borderRadius: radius.cardLg,
  borderWidth: 1,
  borderColor: colors.lineOnLightStrong,
} as const;

const name = [type.bodyBold, { flex: 1, fontSize: 15.5, color: colors.gunmetal }];

/** One exercise done: its name, how many sets and in what unit, and a chip per set. */
export function ExerciseCard({
  done,
  unit,
  color,
  editor,
  isOn,
  shortOf,
  onToggle,
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
    <View style={card}>
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={t("activities.editSets", { exercise: done.exercise })}
        hitSlop={{ top: 8, bottom: 8 }}
        style={press({ flexDirection: "row", alignItems: "center", gap: 8, minHeight: 28 })}
      >
        <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
        <Text style={name}>{done.exercise}</Text>
        <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
          {weighted ? `${count} · ${unit}` : count}
        </Text>
        <HangIcon name="edit" color={colors.textSecondary} size={16} strokeWidth={1.9} />
      </Pressable>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {done.sets.map((set, i) => (
          <SetChip
            key={i}
            text={setChip(set, unit)}
            short={shortOf(i)}
            on={isOn(i)}
            label={t("activities.setOf", { exercise: done.exercise, n: i + 1 })}
            onToggle={() => onToggle(i)}
          />
        ))}
      </View>
    </View>
  );
}
