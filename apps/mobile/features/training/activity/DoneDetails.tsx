import React from "react";
import { Text, View } from "react-native";
import type { ActivityKind } from "@sendtally/api-client";
import type { Dose, ItemDone, SetDone, WeightUnit } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import {
  addSet,
  changeSet,
  offWithout,
  removeSet,
  setKeyOf,
  withLineToggled,
} from "@sendtally/features/activities";
import { heldSet } from "@sendtally/core/hang";
import { supersetHeadAt, targetText, type SetAt } from "@sendtally/features/workouts";
import { t } from "@sendtally/features/i18n";
import type { TallyMeasure } from "@sendtally/features/exercises";
import { useFieldOrder } from "../../../components/useFieldOrder";
import { confirmDestructive } from "../../../lib/confirmDestructive";
import { ClimbSetsRead } from "../climbing/ClimbSetsRead";
import { ChecklistCard } from "../sets/ChecklistCard";
import { ExerciseBlock } from "../sets/ExerciseBlock";
import { ExerciseHead } from "../sets/ExerciseHead";
import { RpeField } from "../sets/RpeField";
import { SET_COLUMNS } from "../sets/setColumns";
import { SetDoneFields } from "../sets/SetDoneFields";
import { SetHeadings } from "../sets/SetHeadings";
import { holdsOnly } from "../sets/holdsOnly";
import { SetRow } from "../sets/SetRow";
import { type } from "../type";

export type DoneDetailsProps = {
  done: readonly ItemDone[];
  /** Sets toggled off, which do not save. */
  off: readonly string[];
  /** Each item's dose this session, which its head states as the target; a grip's set has none. */
  planned: readonly (Dose | SetDone | undefined)[];
  unit: WeightUnit;
  /** What the targets are counted in, outside hangs and laps. */
  kind?: ActivityKind;
  /** A hangboard workout: its sets are hang counts and loads. */
  hangs?: boolean;
  /** The load a hang set shows while it has none of its own: the session's. */
  hangLoadKg?: number;
  /** How a climbing exercise is measured: a circuit's sets are laps of moves. */
  measure?: (exercise: string) => TallyMeasure | null;
  /** Beside the first exercise's name, such as a hangboard run's edge and weight. */
  setup?: React.ReactNode;
  onChange: (done: ItemDone[], off: string[]) => void;
  /** A set with values was removed: say so, with Undo putting it back. */
  onRemoved?: (message: string, undo: () => void) => void;
  /** Inside a card of its own, such as a fingerboard part's: no card per exercise. */
  flat?: boolean;
};

/** Typing in a set records it, so it is ticked. */
const offWithoutKey = (off: readonly string[], item: number, set: number): string[] =>
  off.filter((k) => k !== setKeyOf(item, set));

/**
 * What was done, to review before saving: each exercise as the run's block, its target once in
 * the head and a row per set, ticked when it counts. Pressing a set's number selects it, to
 * remove it. A hang set has no tick: it counts when it held anything.
 */
export function DoneDetails({
  done,
  off,
  planned,
  unit,
  kind = "strength",
  hangs = false,
  hangLoadKg = 0,
  measure = () => null,
  setup,
  onChange,
  onRemoved,
  flat = false,
}: DoneDetailsProps): React.ReactElement {
  const edit = (next: ItemDone[]): void => onChange(next, [...off]);
  const [selected, setSelected] = React.useState<SetAt | null>(null);
  const rated = (d: ItemDone): boolean =>
    hangs || d.targetRpe !== undefined || d.sets.some((s) => s.rpe !== undefined);
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
  // A set's RPE, then the next set's, through every exercise that asks one.
  const rpes = useFieldOrder(
    done.flatMap((d) =>
      rated(d) && !hangs ? d.sets.map((_, i) => `${setKeyOf(d.item, i)}:rpe`) : []
    )
  );
  const remove = (d: ItemDone, set: number): void => {
    const removed = (): void => {
      setSelected(null);
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
  const select = (item: number, set: number): void =>
    setSelected((s) => (s?.item === item && s.set === set ? null : { item, set }));

  const exercises = done.filter((d) => d.checklist === undefined);
  return (
    <>
      {done.map(
        (d) =>
          d.checklist !== undefined && (
            <ChecklistCard
              key={d.item}
              lines={d.checklist.lines}
              ticked={(line) => d.checklist?.checked.includes(line) ?? false}
              onToggle={(line) => edit(withLineToggled(done, d.item, line))}
            />
          )
      )}
      {exercises.length > 0 && (
        <View style={{ gap: flat ? 14 : 10 }}>
          {exercises.map((d, index) => {
            const measured = measure(d.exercise);
            const lap = measured === "laps";
            const dose = planned[d.item];
            const lifting =
              !hangs &&
              (d.sets.some((s) => s.weightKg !== undefined) ||
                (kind === "strength" && d.sets.every((s) => s.onS === undefined)));
            const head = supersetHeadAt(exercises, index);
            const oneHang = hangs && dose?.reps === 1;
            const climbs = !lap && d.sets.some((s) => s.climbs !== undefined);
            const rows = climbs ? (
              <ClimbSetsRead sets={d.sets} />
            ) : (
              <>
                {index === 0 && setup}
                <SetHeadings
                  position={lap ? t("workouts.colLap") : t("activities.colSet")}
                  fields={
                    oneHang
                      ? t("plan.colHeld")
                      : hangs
                        ? t("activities.colHangsLoad")
                        : !lifting && holdsOnly(d.sets)
                          ? t("workouts.dose.hold")
                          : t("activities.colDone")
                  }
                  rpe={rated(d)}
                />
                {d.sets.map((set, i) => {
                  const on = !off.includes(setKeyOf(d.item, i)) && (!hangs || heldSet(set));
                  const label = t("activities.setOf", { exercise: d.exercise, n: i + 1 });
                  const change = (value: typeof set): void =>
                    onChange(changeSet(done, d.item, i, value), offWithoutKey(off, d.item, i));
                  const rpeSlot = (hangs ? counts : rpes).slot(`${setKeyOf(d.item, i)}:rpe`);
                  return (
                    <SetRow
                      key={i}
                      position={String(i + 1)}
                      label={label}
                      ticked={on}
                      onToggle={() => toggle(d.item, i)}
                      {...(hangs && {
                        trailing: <View style={{ width: SET_COLUMNS.tick.width }} />,
                      })}
                      selected={selected?.item === d.item && selected.set === i}
                      onSelect={() => select(d.item, i)}
                      onRemove={() => remove(d, i)}
                      removeLabel={t("activities.removeSet", { n: i + 1 })}
                      testID="review-set"
                      {...(rated(d) && {
                        rpe: on ? (
                          <RpeField
                            set={set}
                            target={d.targetRpe}
                            slot={rpeSlot}
                            label={label}
                            onChange={change}
                          />
                        ) : null,
                      })}
                    >
                      <SetDoneFields
                        set={set}
                        lifting={lifting}
                        hangs={hangs}
                        oneHang={oneHang}
                        unit={unit}
                        label={label}
                        {...(hangs && {
                          slot: counts.slot(setKeyOf(d.item, i)),
                          loadSlot: counts.slot(`${setKeyOf(d.item, i)}:load`),
                        })}
                        defaultLoadKg={hangLoadKg}
                        onChange={change}
                      />
                    </SetRow>
                  );
                })}
              </>
            );
            const add = {
              label: lap ? t("tally.addLap") : t("activities.addSet"),
              accessibilityLabel: t("activities.addSetTo", { exercise: d.exercise }),
              onPress: () => edit(addSet(done, d.item)),
            };
            return (
              <React.Fragment key={d.item}>
                {head !== null && (
                  <Text
                    style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal, paddingTop: 4 }]}
                  >
                    {head}
                  </Text>
                )}
                {flat ? (
                  <View style={{ gap: 4 }}>
                    <ExerciseHead name={d.exercise} />
                    {rows}
                  </View>
                ) : (
                  <ExerciseBlock
                    head={
                      <ExerciseHead
                        name={d.exercise}
                        {...(dose !== undefined &&
                          "sets" in dose && {
                            target: targetText(
                              dose,
                              hangs ? "hangboard" : (measured ?? kind),
                              unit,
                              { round: d.group !== undefined }
                            ),
                          })}
                      />
                    }
                    {...(!climbs && { add })}
                  >
                    {rows}
                  </ExerciseBlock>
                )}
              </React.Fragment>
            );
          })}
        </View>
      )}
    </>
  );
}
