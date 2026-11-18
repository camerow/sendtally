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
  exerciseCountText,
  withLineToggled,
  type SetsOf,
  shortOf,
} from "@sendtally/features/activities";
import { heldSet } from "@sendtally/core/hang";
import { supersetHeadAt } from "@sendtally/features/workouts";
import { t } from "@sendtally/features/i18n";
import { useFieldOrder } from "../../../components/useFieldOrder";
import { confirmDestructive } from "../../../lib/confirmDestructive";
import { Button } from "../components/Button";
import { Label } from "../components/Label";
import { SheetSection } from "../components/SheetSection";
import { SET_COLUMNS } from "../sets/setColumns";
import { type } from "../type";
import { ChecklistReview } from "./ChecklistReview";
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
  /** A hangboard workout: its sets are hang counts and loads. */
  hangs?: boolean;
  /** The load a hang set shows while it has none of its own: the session's. */
  hangLoadKg?: number;
  /** Each exercise's sets as the workout's last run did them, which a lift's target borrows. */
  previous?: (exercise: string) => readonly SetDone[];
  /** Whether an exercise is a circuit, whose sets are laps of moves. */
  laps?: (exercise: string) => boolean;
  /** Beside the first exercise's name, such as a hangboard run's edge and weight. */
  setup?: React.ReactNode;
  onChange: (done: ItemDone[], off: string[]) => void;
  /** A set with values was removed: say so, with Undo putting it back. */
  onRemoved?: (message: string, undo: () => void) => void;
  /** Inside a card of its own, such as a fingerboard part's: no heading, no card per exercise. */
  flat?: boolean;
};

/** Typing in a set records it, so it is ticked. */
const offWithoutKey = (off: readonly string[], item: number, set: number): string[] =>
  off.filter((k) => k !== setKeyOf(item, set));

/**
 * What was done, to review before saving: each exercise as its sets' table, ticked when it
 * counts, amber where it fell short, a number typed in place, a set added or swiped away. A hang
 * set has no tick: it counts when it held anything, and takes an RPE like any set.
 */
export function DoneDetails({
  done,
  off,
  planned,
  unit,
  color,
  hangs = false,
  hangLoadKg = 0,
  previous = () => [],
  laps = () => false,
  setup,
  onChange,
  onRemoved,
  flat = false,
}: DoneDetailsProps): React.ReactElement {
  const edit = (next: ItemDone[]): void => onChange(next, [...off]);
  // A hang set's count, then its load, then its RPE, then the next set's.
  const counts = useFieldOrder(
    hangs
      ? done.flatMap((d) =>
          d.sets.flatMap((_, i) => [
            setKeyOf(d.item, i),
            `${setKeyOf(d.item, i)}:load`,
            `${setKeyOf(d.item, i)}:rpe`,
          ])
        )
      : []
  );
  // A set's RPE, then the next set's, through every exercise.
  const rpes = useFieldOrder(
    hangs ? [] : done.flatMap((d) => d.sets.map((_, i) => `${setKeyOf(d.item, i)}:rpe`))
  );
  const remove = (d: ItemDone, set: number): void => {
    const removed = (): void => {
      onChange(removeSet(done, d.item, set), offWithout(off, d.item, set));
      // An unticked set, or a hang set that held nothing, holds nothing logged, so it goes quietly.
      const held = !hangs || (d.sets[set] !== undefined && heldSet(d.sets[set]));
      if (!off.includes(setKeyOf(d.item, set)) && held)
        onRemoved?.(t("activities.setRemoved", { n: set + 1 }), () =>
          onChange([...done], [...off])
        );
    };
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

  const Frame = flat ? FlatFrame : SetsFrame;
  const exercises = done.filter((d) => d.checklist === undefined);
  return (
    <>
      {done.map(
        (d) =>
          d.checklist !== undefined && (
            <ChecklistReview
              key={d.item}
              list={d.checklist}
              color={color}
              onToggle={(line) => edit(withLineToggled(done, d.item, line))}
            />
          )
      )}
      {exercises.length > 0 && (
        <Frame>
          {exercises.map((d, index) => {
            const target = planned[d.item];
            const of: SetsOf = hangs ? "hangs" : laps(d.exercise) ? "laps" : "sets";
            const lifting = d.sets.some((s) => s.weightKg !== undefined) && !hangs;
            const head = supersetHeadAt(exercises, index);
            return (
              <React.Fragment key={d.item}>
                {head !== null && (
                  <Text
                    style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal, paddingTop: 4 }]}
                  >
                    {head}
                  </Text>
                )}
                <View
                  style={
                    flat
                      ? { gap: 4 }
                      : {
                          gap: 4,
                          padding: 14,
                          borderRadius: 16,
                          borderWidth: 1,
                          borderColor: colors.lineOnLightStrong,
                        }
                  }
                >
                  <View
                    style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingBottom: 4 }}
                  >
                    <View
                      style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }}
                    />
                    <Text
                      style={[type.bodyBold, { flex: 1, fontSize: 17, color: colors.gunmetal }]}
                    >
                      {d.exercise}
                    </Text>
                    <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
                      {exerciseCountText(d, off, of)}
                    </Text>
                  </View>
                  {index === 0 && setup}
                  <View style={SET_COLUMNS.row}>
                    <Label small color={colors.textSecondary} style={SET_COLUMNS.set}>
                      {of === "laps" ? t("workouts.colLap") : t("activities.colSet")}
                    </Label>
                    <Label small color={colors.textSecondary} style={SET_COLUMNS.target}>
                      {t("activities.colTarget")}
                    </Label>
                    <Label small color={colors.textSecondary} style={SET_COLUMNS.done}>
                      {hangs
                        ? t("activities.colHangsLoad")
                        : lifting
                          ? t("activities.colDoneUnit", { unit })
                          : t("activities.colDone")}
                    </Label>
                    <Label small color={colors.textSecondary} style={SET_COLUMNS.rpe}>
                      RPE
                    </Label>
                    {!hangs && <View style={SET_COLUMNS.tick} />}
                  </View>
                  {d.sets.map((set, i) => {
                    const on = !off.includes(setKeyOf(d.item, i)) && (!hangs || heldSet(set));
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
                        short={shortOf(set, target, of)}
                        label={t("activities.setOf", { exercise: d.exercise, n: i + 1 })}
                        slot={hangs ? counts.slot(setKeyOf(d.item, i)) : undefined}
                        loadSlot={hangs ? counts.slot(`${setKeyOf(d.item, i)}:load`) : undefined}
                        defaultLoadKg={hangLoadKg}
                        rpe={{
                          slot: (hangs ? counts : rpes).slot(`${setKeyOf(d.item, i)}:rpe`),
                          target: d.targetRpe,
                        }}
                        onChange={(value) =>
                          onChange(changeSet(done, d.item, i, value), offWithoutKey(off, d.item, i))
                        }
                        onToggle={hangs ? undefined : () => toggle(d.item, i)}
                        onRemove={() => remove(d, i)}
                      />
                    );
                  })}
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                    <Button
                      label={of === "laps" ? t("tally.addLap") : t("activities.addSet")}
                      accessibilityLabel={t("activities.addSetTo", { exercise: d.exercise })}
                      onPress={() => edit(addSet(done, d.item))}
                      variant="outline"
                      icon="plus"
                      height={40}
                    />
                    {d.sets.length > 1 && (
                      <Button
                        label={of === "laps" ? t("tally.removeLap") : t("activities.removeLastSet")}
                        accessibilityLabel={t("activities.removeLastSetFrom", {
                          exercise: d.exercise,
                        })}
                        onPress={() => remove(d, d.sets.length - 1)}
                        variant="outline"
                        icon="minus"
                        height={40}
                      />
                    )}
                  </View>
                </View>
              </React.Fragment>
            );
          })}
        </Frame>
      )}
    </>
  );
}

const SetsFrame = ({ children }: { children: React.ReactNode }): React.ReactElement => (
  <SheetSection label={t("activities.sets")}>{children}</SheetSection>
);

const FlatFrame = ({ children }: { children: React.ReactNode }): React.ReactElement => (
  <View style={{ gap: 14 }}>{children}</View>
);
