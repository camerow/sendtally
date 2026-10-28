import React from "react";
import { Text, View } from "react-native";
import type { ItemDone, WeightUnit } from "@sendtally/core/hang";
import { colors, radius } from "@sendtally/design/tokens";
import {
  addSet,
  changeSet,
  isChecklist,
  removeSet,
  setsLine,
} from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { confirmDestructive } from "../../../lib/confirmDestructive";
import { SheetSection } from "../components/SheetSection";
import { type } from "../type";
import { ChecklistItemRow } from "./ChecklistItemRow";
import { ExerciseCard } from "./ExerciseCard";
import { SetsEditor } from "./SetsEditor";

export type DoneDetailsProps = {
  done: readonly ItemDone[];
  /** Items of a checklist left unticked. */
  skipped: readonly number[];
  unit: WeightUnit;
  onChange: (done: ItemDone[]) => void;
  onSkip: (skipped: number[]) => void;
};

/** What was done, to review and fix before saving: a card per exercise, or a checklist to tick. */
export function DoneDetails({
  done,
  skipped,
  unit,
  onChange,
  onSkip,
}: DoneDetailsProps): React.ReactElement {
  const [open, setOpen] = React.useState<number | null>(null);
  const remove = (d: ItemDone, set: number): void => {
    const removed = (): void => onChange(removeSet(done, d.item, set));
    if (d.sets.length > 1) {
      removed();
      return;
    }
    confirmDestructive({
      title: t("activities.removeLastSetTitle", { exercise: d.exercise }),
      body: t("activities.removeLastSetBody"),
      action: t("workouts.removeExercise", { name: d.exercise }),
      onConfirm: () => {
        setOpen(null);
        removed();
      },
    });
  };
  const editor = (d: ItemDone): React.ReactNode =>
    open === d.item ? (
      <SetsEditor
        done={d}
        unit={unit}
        onChange={(set, value) => onChange(changeSet(done, d.item, set, value))}
        onRemove={(set) => remove(d, set)}
        onAdd={() => onChange(addSet(done, d.item))}
      />
    ) : null;
  const toggle = (item: number): void =>
    onSkip(skipped.includes(item) ? skipped.filter((i) => i !== item) : [...skipped, item]);

  if (!isChecklist(done)) {
    return (
      <SheetSection label={t("activities.details")}>
        {done.map((d) => (
          <ExerciseCard
            key={d.item}
            done={d}
            unit={unit}
            editor={editor(d)}
            onOpen={() => setOpen(d.item)}
            onClose={() => setOpen(null)}
          />
        ))}
      </SheetSection>
    );
  }
  const ticked = done.filter((d) => !skipped.includes(d.item)).length;
  return (
    <SheetSection
      label={t("activities.details")}
      aside={
        <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
          {t("plan.doneOf", { done: ticked, planned: done.length })}
        </Text>
      }
    >
      <View
        style={{
          paddingHorizontal: 14,
          paddingVertical: 4,
          borderRadius: radius.card,
          borderWidth: 1,
          borderColor: colors.lineOnLightStrong,
        }}
      >
        {done.map((d) => (
          <React.Fragment key={d.item}>
            <ChecklistItemRow
              name={d.exercise}
              dose={setsLine(d.sets, unit)}
              ticked={!skipped.includes(d.item)}
              open={open === d.item}
              onToggle={() => toggle(d.item)}
              onOpen={() => setOpen(open === d.item ? null : d.item)}
            />
            {editor(d)}
          </React.Fragment>
        ))}
      </View>
    </SheetSection>
  );
}
