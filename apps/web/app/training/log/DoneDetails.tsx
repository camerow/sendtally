import React from "react";
import type { ActivityKind } from "@sendtally/api-client";
import {
  heldSet,
  type Dose,
  type ItemDone,
  type SetClimb,
  type SetDone,
  type WeightUnit,
} from "@sendtally/core/hang";
import {
  addSet,
  changeSet,
  lapPlanFor,
  offWithout,
  removeSet,
  setKeyOf,
  withLineToggled,
  withSetClimbs,
} from "@sendtally/features/activities";
import { useDisplayScales } from "@sendtally/features/settings";
import type { TallyMeasure } from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import {
  supersetHeadAt,
  targetText,
  useGradePicker,
  type SetAt,
} from "@sendtally/features/workouts";
import { Sheet } from "../../components/Sheet";
import { climbGradeText } from "../climbing/ClimbGrade";
import { ClimbSetsEdit, type ClimbAt } from "../climbing/ClimbSetsEdit";
import { LapValue } from "../climbing/LapValue";
import { ChecklistCard } from "../components/ChecklistCard";
import { ExerciseBlock } from "../components/ExerciseBlock";
import { ExerciseHead } from "../components/ExerciseHead";
import { RpeField } from "../components/RpeField";
import { SetDoneFields } from "../components/SetDoneFields";
import { SetHeadings } from "../components/SetHeadings";
import { onControl, SetRow } from "../components/SetRow";
import { holdsOnly } from "../components/setColumns";
import { useSessionTarget } from "../components/sessionTarget";

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
 * the head and a row per set, ticked when it counts. Clicking a set's row selects it, to remove
 * it. A hang set has no tick: it counts when it held anything.
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
  const sessionRpe = useSessionTarget();
  const scales = useDisplayScales();
  const [selected, setSelected] = React.useState<SetAt | null>(null);
  const [lastOf, setLastOf] = React.useState<ItemDone | null>(null);
  const rated = (d: ItemDone): boolean =>
    hangs || d.targetRpe !== undefined || d.sets.some((s) => s.rpe !== undefined);
  const removed = (d: ItemDone, set: number): void => {
    setSelected(null);
    onChange(removeSet(done, d.item, set), offWithout(off, d.item, set));
    // An unticked set, or a hang set that held nothing, holds nothing logged, so it goes quietly.
    const held = !hangs || (d.sets[set] !== undefined && heldSet(d.sets[set]));
    if (!off.includes(setKeyOf(d.item, set)) && held)
      onRemoved?.(t("activities.setRemoved", { n: set + 1 }), () => onChange([...done], [...off]));
  };
  const remove = (d: ItemDone, set: number): void =>
    d.sets.length > 1 ? removed(d, set) : setLastOf(d);
  const toggle = (item: number, set: number): void => {
    const key = setKeyOf(item, set);
    onChange([...done], off.includes(key) ? off.filter((k) => k !== key) : [...off, key]);
  };
  const select = (item: number, set: number): void =>
    setSelected((s) => (s?.item === item && s.set === set ? null : { item, set }));

  React.useEffect(() => {
    if (selected === null) return;
    const onClick = (e: MouseEvent): void => {
      if (e.target instanceof Element && !onControl(e.target) && !e.target.closest(".set-item"))
        setSelected(null);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [selected]);

  const exercises = done.filter((d) => d.checklist === undefined);
  const climbing = (d: ItemDone): boolean =>
    measure(d.exercise) !== "laps" &&
    (measure(d.exercise) !== null || d.sets.some((s) => s.climbs !== undefined));
  const [pickAt, setPickAt] = React.useState<{ item: number; set: number } | null>(null);
  const lastClimbing = exercises.filter(climbing).at(-1);
  const at =
    pickAt ??
    (lastClimbing === undefined
      ? null
      : { item: lastClimbing.item, set: Math.max(0, lastClimbing.sets.length - 1) });
  const [climbSelected, setClimbSelected] = React.useState<({ item: number } & ClimbAt) | null>(
    null
  );
  const climbsAt = (item: number, set: number, f: (c: SetClimb[]) => SetClimb[]): void =>
    onChange(withSetClimbs(done, item, set, f), offWithoutKey(off, item, set));
  const picker = useGradePicker(scales, (climb) => {
    if (at !== null) climbsAt(at.item, at.set, (c) => [...c, climb]);
  });
  return (
    <>
      {done.map(
        (d) =>
          d.checklist !== undefined && (
            <ChecklistCard
              key={d.item}
              lines={d.checklist.lines}
              ticked={(line) => d.checklist?.checked.includes(line) ?? false}
              onToggle={(line) => onChange(withLineToggled(done, d.item, line), [...off])}
            />
          )
      )}
      {exercises.length > 0 && (
        <div className={flat ? "done-body done-body--flat" : "done-body"} data-testid="review-body">
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
            const climbs = climbing(d);
            const rows = climbs ? (
              <ClimbSetsEdit
                sets={d.sets}
                picking={at?.item === d.item ? at.set : null}
                picker={picker}
                selected={climbSelected?.item === d.item ? climbSelected : null}
                onSelect={(c) =>
                  setClimbSelected((was) =>
                    was?.item === d.item && was.set === c.set && was.index === c.index
                      ? null
                      : { item: d.item, ...c }
                  )
                }
                onPressSet={(set) => setPickAt({ item: d.item, set })}
                onChange={(c, climb) =>
                  climbsAt(d.item, c.set, (all) => all.map((x, i) => (i === c.index ? climb : x)))
                }
                onRemove={(c) => {
                  const removed = d.sets[c.set]?.climbs?.[c.index];
                  setClimbSelected(null);
                  climbsAt(d.item, c.set, (all) => all.filter((_, i) => i !== c.index));
                  if (removed !== undefined)
                    onRemoved?.(
                      `${d.exercise} · ${t("tally.climbRemoved", { grade: climbGradeText(removed, scales) })}`,
                      () => onChange([...done], [...off])
                    );
                }}
              />
            ) : lap ? (
              d.sets.map((set, i) => {
                const plan = lapPlanFor(
                  dose !== undefined && "sets" in dose ? dose : undefined,
                  d.sets
                );
                const label = t("tally.lapLabel", { lap: i + 1 });
                return (
                  <SetRow
                    key={i}
                    position={String(i + 1)}
                    label={label}
                    ticked={!off.includes(setKeyOf(d.item, i))}
                    onToggle={() => toggle(d.item, i)}
                    selected={selected?.item === d.item && selected.set === i}
                    onSelect={() => select(d.item, i)}
                    onRemove={() => remove(d, i)}
                    removeLabel={t("tally.removeLapOf", { lap: i + 1 })}
                  >
                    <LapValue
                      label={label}
                      value={plan.unit === "seconds" ? (set.onS ?? 0) : (set.reps ?? 0)}
                      plan={plan}
                      onChange={(reps) =>
                        onChange(
                          changeSet(done, d.item, i, { ...set, reps }),
                          offWithoutKey(off, d.item, i)
                        )
                      }
                    />
                  </SetRow>
                );
              })
            ) : (
              <>
                {index === 0 && setup}
                <SetHeadings
                  position={lap ? t("workouts.colLap") : t("activities.colSet")}
                  fields={
                    oneHang
                      ? t("plan.colHeld")
                      : hangs
                        ? t("plan.colHangs")
                        : !lifting && holdsOnly(d.sets)
                          ? t("workouts.dose.hold")
                          : t("activities.colDone")
                  }
                  rpe={rated(d)}
                  {...(hangs && { measure: t("hang.load"), tick: false })}
                />
                {d.sets.map((set, i) => {
                  const on = !off.includes(setKeyOf(d.item, i)) && (!hangs || heldSet(set));
                  const label = t("activities.setOf", { exercise: d.exercise, n: i + 1 });
                  const change = (value: SetDone): void =>
                    onChange(changeSet(done, d.item, i, value), offWithoutKey(off, d.item, i));
                  return (
                    <SetRow
                      key={i}
                      position={String(i + 1)}
                      label={label}
                      ticked={on}
                      onToggle={() => toggle(d.item, i)}
                      {...(hangs && { trailing: null })}
                      selected={selected?.item === d.item && selected.set === i}
                      onSelect={() => select(d.item, i)}
                      onRemove={() => remove(d, i)}
                      removeLabel={t("activities.removeSet", { n: i + 1 })}
                      {...(rated(d) && {
                        rpe: on ? (
                          <RpeField
                            set={set}
                            target={d.targetRpe}
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
                        defaultLoadKg={hangLoadKg}
                        onChange={change}
                      />
                    </SetRow>
                  );
                })}
              </>
            );
            return (
              <React.Fragment key={d.item}>
                {head !== null && <span className="done-superset-head">{head}</span>}
                {flat ? (
                  <div className="done-flat-exercise">
                    <ExerciseHead name={d.exercise} />
                    {rows}
                  </div>
                ) : (
                  <ExerciseBlock
                    {...(climbs && {
                      onPress: () =>
                        setPickAt({ item: d.item, set: Math.max(0, d.sets.length - 1) }),
                    })}
                    head={
                      <ExerciseHead
                        name={d.exercise}
                        {...(dose !== undefined &&
                          "sets" in dose && {
                            target: targetText(
                              dose,
                              hangs ? "hangboard" : (measured ?? kind),
                              unit,
                              { round: d.group !== undefined, sessionRpe }
                            ),
                          })}
                      />
                    }
                    add={{
                      label: lap ? t("tally.addLap") : t("activities.addSet"),
                      accessibilityLabel: t("activities.addSetTo", { exercise: d.exercise }),
                      onPress: () => {
                        onChange(addSet(done, d.item), [...off]);
                        if (climbs) setPickAt({ item: d.item, set: d.sets.length });
                      },
                    }}
                  >
                    {rows}
                  </ExerciseBlock>
                )}
              </React.Fragment>
            );
          })}
          <Sheet
            open={lastOf !== null}
            title={t("activities.removeLastSetTitle", { exercise: lastOf?.exercise ?? "" })}
            onClose={() => setLastOf(null)}
            action={{
              label: t("workouts.removeExercise", { name: lastOf?.exercise ?? "" }),
              danger: true,
              onPress: () => {
                if (lastOf !== null) removed(lastOf, 0);
                setLastOf(null);
              },
            }}
          >
            <p className="sheet-body">{t("activities.removeLastSetBody")}</p>
          </Sheet>
        </div>
      )}
    </>
  );
}
