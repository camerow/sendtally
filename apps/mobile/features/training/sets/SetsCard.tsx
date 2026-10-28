import React from "react";
import { Text, View } from "react-native";
import type { SessionItem, ItemDone, SetDone, WeightUnit } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { exerciseName } from "@sendtally/features/workouts";
import { Label } from "../components/Label";
import { type } from "../type";
import { SET_COLUMNS } from "./setColumns";
import { SetRow } from "./SetRow";
import { setKey, type SetAt } from "./setsRun";

export type SetsCardProps = {
  item: SessionItem;
  done: ItemDone;
  /** Each set as the last run of this workout did it. */
  previous: readonly SetDone[];
  lifting: boolean;
  ticked: ReadonlySet<string>;
  current: SetAt | null;
  unit: WeightUnit;
  onChange: (set: number, value: SetDone) => void;
  onToggle: (set: number) => void;
};

/** One exercise of the workout as a table of its sets. */
export function SetsCard({
  item,
  done,
  previous,
  lifting,
  ticked,
  current,
  unit,
  onChange,
  onToggle,
}: SetsCardProps): React.ReactElement {
  const name = exerciseName(item.exercise);
  const { sets: _, ...target } = item.dose;
  return (
    <View
      style={{
        gap: 4,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
      }}
    >
      <Text style={[type.bodyBold, { fontSize: 17, color: colors.gunmetal, paddingBottom: 4 }]}>
        {name}
      </Text>
      <View style={SET_COLUMNS.row}>
        <Label small color={colors.textSecondary} style={SET_COLUMNS.set}>
          {t("activities.colSet")}
        </Label>
        <Label small color={colors.textSecondary} style={SET_COLUMNS.target}>
          {t("activities.colTarget")}
        </Label>
        <Label small color={colors.textSecondary} style={SET_COLUMNS.done}>
          {t("activities.colDone")}
        </Label>
        <View style={SET_COLUMNS.tick} />
      </View>
      {done.sets.map((set, i) => (
        <SetRow
          key={i}
          n={i + 1}
          target={
            lifting ? { ...target, weightKg: target.weightKg ?? previous[i]?.weightKg } : target
          }
          done={set}
          previous={previous[i]}
          lifting={lifting}
          ticked={ticked.has(setKey({ item: done.item, set: i }))}
          current={current?.item === done.item && current.set === i}
          unit={unit}
          label={t("activities.setOf", { exercise: name, n: i + 1 })}
          onChange={(value) => onChange(i, value)}
          onToggle={() => onToggle(i)}
        />
      ))}
    </View>
  );
}
