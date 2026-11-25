import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import {
  isChecklist,
  itemIdOf,
  type Dose,
  type WeekChange,
  type WeightUnit,
} from "@sendtally/core/hang";
import { hangLoadText, weightText } from "../hang/weights";
import type { HangModel } from "../hang/model";
import { t } from "../i18n";
import { clampWeeks } from "../training/blockMeta";
import { emptyPlanDraft } from "../training/planDraft";
import type { PlanActions } from "../training/usePlanActions";
import { exerciseName } from "../workouts/library";
import type { LibraryWorkout } from "../workouts/types";
import type { WorkoutLibraryQuery } from "../workouts/useWorkoutLibrary";
import { usePlan } from "../training/usePlan";
import { shortcutChanges, shortcutOf, type LoadBar, type Shortcuts } from "./planMaths";
import { placedWorkouts, useSeededPlanPath } from "./planPath";
import type { Wizard } from "./types";

export const MIN_WEEKS = 2;

export type Changes = Record<number, Partial<Dose>[]>;

type Item = LibraryWorkout["items"][number];

export const sized = (
  changes: readonly Partial<Dose>[] | undefined,
  weeks: number
): Partial<Dose>[] => Array.from({ length: weeks }, (_, i) => changes?.[i] ?? {});

export const changed = (c: Partial<Dose> | undefined): boolean =>
  c !== undefined && Object.keys(c).length > 0;

/** The item P4 changes: the first weighted one, else the first that is not a checklist. */
export const blockItem = (workout: LibraryWorkout | undefined): Item | undefined =>
  workout?.items.find((i) => (i.doses[0]?.weightKg ?? 0) > 0) ??
  workout?.items.find((i) => !isChecklist(i));

/** The workout Shape the weeks changes: the first placed one with an exercise it can load. */
export const shapeable = <W extends LibraryWorkout>(
  workouts: readonly (W | undefined)[]
): W | undefined => workouts.find((w) => blockItem(w) !== undefined);

export const filled = (
  doses: readonly Dose[],
  next: Shortcuts,
  length: number,
  unit: WeightUnit
): Changes => Object.fromEntries(doses.map((d, i) => [i, shortcutChanges(d, length, next, unit)]));

export const resized = (
  changes: Changes,
  doses: readonly Dose[],
  shortcuts: Shortcuts,
  weeks: number,
  unit: WeightUnit
): Changes =>
  shortcuts.stepUp || shortcuts.deload
    ? filled(doses, shortcuts, weeks, unit)
    : Object.fromEntries(doses.map((_, i) => [i, sized(changes[i], weeks)]));

export const withCell = (
  changes: Changes,
  dose: number,
  weeks: number,
  week: number,
  change: Partial<Dose>
): Changes => ({
  ...changes,
  [dose]: sized(changes[dose], weeks).map((x, i) => (i === week - 1 ? change : x)),
});

export const loadText = (d: Dose, kind: LibraryWorkout["kind"], unit: WeightUnit): string =>
  (d.weightKg ?? 0) > 0
    ? kind === "hangboard"
      ? hangLoadText(d.weightKg ?? 0, unit)
      : weightText(d.weightKg ?? 0, unit)
    : t("statistics.repsValue", { count: d.reps ?? 0 });

export const loadBars = (
  written: Dose,
  changes: readonly Partial<Dose>[],
  deload: boolean,
  kind: LibraryWorkout["kind"],
  unit: WeightUnit
): LoadBar[] =>
  changes.map((c, i) => {
    const d = { ...written, ...c };
    return {
      label: loadText(d, kind, unit),
      value: d.sets * (d.reps ?? 1) * ((d.weightKg ?? 0) > 0 ? (d.weightKg ?? 0) : 10),
      deload: deload && changes.length > 1 && i === changes.length - 1,
    };
  });

/** Weeks where any dose differs from how it is written. */
export const changedWeeks = (doses: readonly (readonly Partial<Dose>[])[], weeks: number): number =>
  Array.from({ length: weeks }, (_, w) => w).filter((w) => doses.some((c) => changed(c[w]))).length;

export const weekChangesOf = (
  members: readonly string[],
  doses: readonly (readonly Partial<Dose>[])[],
  itemId: string
): WeekChange[] =>
  members.flatMap((membershipId) =>
    doses.flatMap((list, d) =>
      list.flatMap((change, i) =>
        changed(change) ? [{ membershipId, week: i + 1, dose: d, itemId, change }] : []
      )
    )
  );

export type BlockStepState =
  | { status: "loading" }
  | {
      status: "ready";
      workout: LibraryWorkout;
      exercise: string;
      weeks: number;
      resize: (by: 1 | -1) => void;
      alt: boolean;
      dose: number;
      setShown: (dose: number) => void;
      written: Dose;
      weighted: boolean;
      shortcuts: Shortcuts;
      anyShortcut: boolean;
      toggle: (key: keyof Shortcuts) => void;
      shownChanges: Partial<Dose>[];
      setCell: (week: number, change: Partial<Dose>) => void;
      bars: LoadBar[];
      save: () => void;
    };

/** P4's state, opened from the reveal: the block's length and load changes, saved back onto it. */
export function useBlockStep({
  wizard,
  api,
  model,
  library,
  actions,
}: {
  wizard: Wizard;
  api: SendtallyApi;
  model: HangModel;
  library: WorkoutLibraryQuery["state"];
  actions: PlanActions;
}): BlockStepState {
  const unit = model.settings.units;
  const path = useSeededPlanPath(api);
  const plan = usePlan(api).state;
  const [stepped, setStepped] = React.useState<number | null>(null);
  const [shortcuts, setShortcuts] = React.useState<Shortcuts>({ stepUp: false, deload: false });
  const [shown, setShown] = React.useState(0);
  const [changes, setChanges] = React.useState<Changes>({});

  const block =
    plan.status === "ready" ? plan.data.blocks.find((b) => b.id === path.blockId) : undefined;
  const workout =
    library.status === "ready"
      ? shapeable(placedWorkouts(path).map((id) => library.data.workout(id)))
      : undefined;
  const first = workout?.id;
  const item = blockItem(workout);

  if (block === undefined || workout === undefined || item === undefined || plan.status !== "ready")
    return { status: "loading" };

  const weeks = stepped ?? clampWeeks(block.weeks, MIN_WEEKS);
  const alt = item.doses.length > 1;
  const dose = alt ? shown : 0;
  const written = item.doses[dose] ?? item.doses[0] ?? { sets: 1 };
  const weighted = (item.doses[0]?.weightKg ?? 0) > 0;
  const itemId = itemIdOf(item, workout.items.indexOf(item));
  const shownChanges = sized(changes[dose], weeks);
  const anyShortcut = shortcuts.stepUp || shortcuts.deload;

  const toggle = (key: keyof Shortcuts): void => {
    const next = { ...shortcuts, [key]: !shortcuts[key] };
    setShortcuts(next);
    setChanges(filled(item.doses, next, weeks, unit));
  };

  const resize = (by: 1 | -1): void => {
    const next = clampWeeks(weeks + by, MIN_WEEKS);
    setStepped(next);
    setChanges((c) => resized(c, item.doses, shortcuts, next, unit));
  };

  const setCell = (week: number, change: Partial<Dose>): void =>
    setChanges((c) => withCell(c, dose, weeks, week, change));

  const ready = library.status === "ready" ? library.data : null;
  const doses = item.doses.map((_, d) => sized(changes[d], weeks));

  const save = (): void => {
    const members = path.workouts
      .filter(
        (w) =>
          w === first ||
          (item.id !== undefined && ready?.workout(w)?.items.some((i) => i.id === item.id) === true)
      )
      .flatMap((w) => {
        const id = path.members[w];
        return id === undefined ? [] : [id];
      });
    void actions.saveDraft({
      ...emptyPlanDraft,
      block: { ...block, weeks },
      weekChanges: weekChangesOf(members, doses, itemId),
    });
    wizard.next({ count: changedWeeks(doses, weeks), shortcut: shortcutOf(shortcuts) });
  };

  return {
    status: "ready",
    workout,
    exercise: exerciseName(item.exercise, model.gripName),
    weeks,
    resize,
    alt,
    dose,
    setShown,
    written,
    weighted,
    shortcuts,
    anyShortcut,
    toggle,
    shownChanges,
    setCell,
    bars: loadBars(written, shownChanges, shortcuts.deload, workout.kind, unit),
    save,
  };
}
