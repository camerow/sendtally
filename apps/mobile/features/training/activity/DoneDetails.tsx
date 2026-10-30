import React from "react";
import { Text } from "react-native";
import type { ItemDone, SetDone, WeightUnit } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import {
  addSet,
  changeSet,
  offWithout,
  removeSet,
  setKeyOf,
  shortOf,
} from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { confirmDestructive } from "../../../lib/confirmDestructive";
import { SheetSection } from "../components/SheetSection";
import { type } from "../type";
import { ExerciseCard } from "./ExerciseCard";
import { SetsEditor } from "./SetsEditor";

export type DoneDetailsProps = {
  done: readonly ItemDone[];
  /** Sets toggled off, which do not save. */
  off: readonly string[];
  /** Each item's dose, which a set short of it reads against. */
  planned: readonly (SetDone | undefined)[];
  unit: WeightUnit;
  /** The kind's colour, on each exercise's mark. */
  color: string;
  onChange: (done: ItemDone[], off: string[]) => void;
};

/** What was done, to review and fix before saving: a card per exercise, a chip per set to tick. */
export function DoneDetails({
  done,
  off,
  planned,
  unit,
  color,
  onChange,
}: DoneDetailsProps): React.ReactElement {
  const [open, setOpen] = React.useState<number | null>(null);
  const edit = (next: ItemDone[]): void => onChange(next, [...off]);
  const remove = (d: ItemDone, set: number): void => {
    const removed = (): void =>
      onChange(removeSet(done, d.item, set), offWithout(off, d.item, set));
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
  const toggle = (item: number, set: number): void => {
    const key = setKeyOf(item, set);
    onChange([...done], off.includes(key) ? off.filter((k) => k !== key) : [...off, key]);
  };

  return (
    <SheetSection
      label={t("activities.sets")}
      aside={
        <Text style={[type.mono, { fontSize: 11.5, color: colors.textMuted }]}>
          {t("activities.setsHint")}
        </Text>
      }
    >
      {done.map((d) => (
        <ExerciseCard
          key={d.item}
          done={d}
          unit={unit}
          color={color}
          editor={
            open === d.item ? (
              <SetsEditor
                done={d}
                unit={unit}
                onChange={(set, value) => edit(changeSet(done, d.item, set, value))}
                onRemove={(set) => remove(d, set)}
                onAdd={() => edit(addSet(done, d.item))}
              />
            ) : null
          }
          isOn={(set) => !off.includes(setKeyOf(d.item, set))}
          shortOf={(set) => shortOf(d.sets[set] ?? {}, planned[d.item])}
          onToggle={(set) => toggle(d.item, set)}
          onOpen={() => setOpen(d.item)}
          onClose={() => setOpen(null)}
        />
      ))}
    </SheetSection>
  );
}
