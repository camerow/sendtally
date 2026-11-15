import type { Workout } from "@sendtally/core/hang";
import { t } from "../i18n";
import { workoutsUsing } from "../statistics/exercises";
import { withItemsAdded } from "../workouts/editorState";
import { newWorkoutDraft } from "../workouts/library";
import type { LibraryWorkout, Picked, WorkoutDraft } from "../workouts/types";
import { exerciseLabel } from "./builtIns";
import type { MadeExercise, PickerEntry } from "./types";

/** An exercise as a row offers it: a grip, the user's own, or a built-in. */
export type ExerciseEntry = Pick<PickerEntry, "kind" | "name" | "source">;

/** The entry for an exercise or grip just made. */
export const entryOf = (made: MadeExercise): ExerciseEntry =>
  "grip" in made
    ? { kind: "hangboard", name: made.grip.name, source: made }
    : { kind: made.exercise.kind, name: exerciseLabel(made.exercise), source: made };

/** What the entry's workout items name: a grip by its id, an exercise by its name. */
const itemName = (e: ExerciseEntry): string =>
  "grip" in e.source
    ? e.source.grip.id
    : "exercise" in e.source
      ? e.source.exercise.name
      : e.source.builtIn.name;

/** The workouts with an item of the entry; a grip only counts on the hangboard. */
export function workoutsWith<W extends Pick<Workout, "kind" | "items">>(
  workouts: readonly W[],
  e: ExerciseEntry
): W[] {
  if (!("grip" in e.source)) return workoutsUsing(workouts, itemName(e));
  const id = e.source.grip.id;
  return workouts.filter((w) => w.kind === "hangboard" && w.items.some((i) => i.exercise === id));
}

/** "In 2 workouts", or that none uses it yet. */
export const usedInText = (count: number): string =>
  count === 0 ? t("workouts.notInWorkout") : t("workouts.inWorkouts", { count });

/**
 * The one-exercise workout the entry adds as: of the user's own workouts holding only it, the
 * one named after it, else the first.
 */
export function wrapperOf(
  workouts: readonly LibraryWorkout[],
  e: ExerciseEntry
): LibraryWorkout | undefined {
  const name = "grip" in e.source ? e.name : itemName(e);
  const ones = workoutsWith(workouts, e).filter((w) => w.source === "mine" && w.items.length === 1);
  return ones.find((w) => w.name === name) ?? ones[0];
}

/** A new workout of the one exercise picked, named after it, at its starting dose. */
export function wrapperDraft(e: ExerciseEntry, picked: Picked, newId: () => string): WorkoutDraft {
  const name = "grip" in e.source ? e.name : picked.exercise;
  return withItemsAdded({ ...newWorkoutDraft(e.kind), name }, [picked], newId);
}

export type ExerciseWorkoutArgs = {
  workouts: readonly LibraryWorkout[];
  /** Makes a built-in the user's own first; null when that failed. */
  pick: (source: PickerEntry["source"]) => Promise<Picked | null>;
  save: (id: string, workout: WorkoutDraft) => Promise<void>;
  newId: () => string;
};

/**
 * The workout an exercise goes in a block or on a day as: its wrapper, made the first time.
 * Null when making its exercise failed.
 */
export const exerciseWorkout =
  ({ workouts, pick, save, newId }: ExerciseWorkoutArgs) =>
  async (e: ExerciseEntry): Promise<string | null> => {
    const there = wrapperOf(workouts, e);
    if (there !== undefined) return there.id;
    const picked = await pick(e.source);
    if (picked === null) return null;
    const id = newId();
    void save(id, wrapperDraft(e, picked, newId));
    return id;
  };
