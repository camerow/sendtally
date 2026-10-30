import React from "react";
import { Text, View } from "react-native";
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
import { useFieldOrder } from "../../../components/useFieldOrder";
import { confirmDestructive } from "../../../lib/confirmDestructive";
import { Button } from "../components/Button";
import { Label } from "../components/Label";
import { SheetSection } from "../components/SheetSection";
import { SET_COLUMNS } from "../sets/setColumns";
import { type } from "../type";
import { ReviewSetRow } from "./ReviewSetRow";

export type DoneDetailsProps = {
  done: readonly ItemDone[];
  /** Sets toggled off, which do not save. */
  off: readonly string[];
  /** Each item's dose, which a set short of it reads against. */
  planned: readonly (SetDone | undefined)[];
  unit: WeightUnit;
  /** The kind's colour, on each exercise's mark. */
  color: string;
  /** A hangboard workout: its sets are hang counts. */
  hangs?: boolean;
  /** Each exercise's sets as the workout's last run did them, which a lift's target borrows. */
  previous?: (exercise: string) => readonly SetDone[];
  /** Beside the first exercise's name, such as a hangboard run's edge and weight. */
  setup?: React.ReactNode;
  onChange: (done: ItemDone[], off: string[]) => void;
};

/**
 * What was done, to review before saving: each exercise as its sets' table, ticked when it
 * counts, amber where it fell short, a number typed in place, a set added or swiped away.
 */
export function DoneDetails({
  done,
  off,
  planned,
  unit,
  color,
  hangs = false,
  previous = () => [],
  setup,
  onChange,
}: DoneDetailsProps): React.ReactElement {
  const edit = (next: ItemDone[]): void => onChange(next, [...off]);
  const counts = useFieldOrder(
    hangs
      ? done.flatMap((d) =>
          d.sets.flatMap((_, i) => (off.includes(setKeyOf(d.item, i)) ? [] : [setKeyOf(d.item, i)]))
        )
      : []
  );
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
      onConfirm: removed,
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
      {done.map((d, index) => {
        const target = planned[d.item];
        const lifting = d.sets.some((s) => s.weightKg !== undefined) && !hangs;
        return (
          <View
            key={d.item}
            style={{
              gap: 4,
              padding: 14,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.lineOnLightStrong,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingBottom: 4 }}>
              <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
              <Text style={[type.bodyBold, { flex: 1, fontSize: 17, color: colors.gunmetal }]}>
                {d.exercise}
              </Text>
              <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
                {t("activities.setCount", { count: d.sets.length })}
              </Text>
            </View>
            {index === 0 && setup}
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
            {d.sets.map((set, i) => {
              const on = !off.includes(setKeyOf(d.item, i));
              return (
                <ReviewSetRow
                  key={i}
                  n={i + 1}
                  target={
                    target === undefined || target.onS !== undefined
                      ? target
                      : {
                          ...target,
                          weightKg: target.weightKg ?? previous(d.exercise)[i]?.weightKg,
                        }
                  }
                  done={set}
                  hangs={hangs}
                  lifting={lifting}
                  unit={unit}
                  on={on}
                  short={shortOf(set, target, hangs)}
                  label={t("activities.setOf", { exercise: d.exercise, n: i + 1 })}
                  slot={hangs ? counts.slot(setKeyOf(d.item, i)) : undefined}
                  onChange={(value) => edit(changeSet(done, d.item, i, value))}
                  onToggle={() => toggle(d.item, i)}
                  onRemove={() => remove(d, i)}
                />
              );
            })}
            <Button
              label={t("activities.addSet")}
              accessibilityLabel={t("activities.addSetTo", { exercise: d.exercise })}
              onPress={() => edit(addSet(done, d.item))}
              variant="outline"
              icon="plus"
              height={40}
              style={{ alignSelf: "flex-start", marginTop: 6 }}
            />
          </View>
        );
      })}
    </SheetSection>
  );
}
