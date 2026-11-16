import React from "react";
import { exerciseNameKey, type Workout } from "@sendtally/core/hang";
import { t } from "../i18n";
import { withItemsAdded } from "../workouts/editorState";
import { newWorkoutDraft } from "../workouts/library";
import type { LibraryWorkout, Picked, WorkoutDraft } from "../workouts/types";
import type { Exercise } from "@sendtally/api-client";
import { builtInExercise, exerciseLabel } from "./builtIns";
import type { MadeExercise, PickerEntry } from "./types";

/** An exercise as a row offers it: a grip, the user's own, or a built-in. */
export type ExerciseEntry = Pick<PickerEntry, "kind" | "name" | "source">;

/** The entry for an exercise or grip just made. */
export const entryOf = (made: MadeExercise): ExerciseEntry =>
  "grip" in made
    ? { kind: "hangboard", name: made.grip.name, source: made }
    : { kind: made.exercise.kind, name: exerciseLabel(made.exercise), source: made };

/** The exercise an id opens: the user's own, their copy of a built-in, else the built-in. */
export function exerciseEntry(
  exercises: readonly Exercise[],
  id: string
): ExerciseEntry | undefined {
  const exercise = exercises.find((e) => e.id === id || (e.builtIn === id && !e.archived));
  if (exercise !== undefined)
    return { kind: exercise.kind, name: exerciseLabel(exercise), source: { exercise } };
  const builtIn = builtInExercise(id);
  return builtIn === undefined
    ? undefined
    : { kind: builtIn.kind, name: builtIn.name, source: { builtIn } };
}

/** What the entry's workout items name: a grip by its id, an exercise by its name. */
const itemName = (e: ExerciseEntry): string =>
  "grip" in e.source
    ? e.source.grip.id
    : "exercise" in e.source
      ? e.source.exercise.name
      : e.source.builtIn.name;

/** The workouts with an item of the entry, matched as the Worker matches names; a grip only counts on the hangboard. */
export function workoutsWith<W extends Pick<Workout, "kind" | "items">>(
  workouts: readonly W[],
  e: ExerciseEntry
): W[] {
  const grip = "grip" in e.source;
  const key = exerciseNameKey(itemName(e));
  return workouts.filter(
    (w) =>
      (w.kind === "hangboard") === grip && w.items.some((i) => exerciseNameKey(i.exercise) === key)
  );
}

/** "In 2 workouts", or that none uses it yet. */
export const usedInText = (count: number): string =>
  count === 0 ? t("workouts.notInWorkout") : t("workouts.inWorkouts", { count });

/**
 * The one-exercise workout the entry adds as: of the user's own workouts holding only it, the
 * one named after it in any case, else the first.
 */
export function wrapperOf(
  workouts: readonly LibraryWorkout[],
  e: ExerciseEntry
): LibraryWorkout | undefined {
  const name = "grip" in e.source ? e.name : itemName(e);
  const ones = workoutsWith(workouts, e).filter((w) => w.source === "mine" && w.items.length === 1);
  return ones.find((w) => exerciseNameKey(w.name) === exerciseNameKey(name)) ?? ones[0];
}

/** A new workout of the one exercise picked, named after it, at its starting dose. */
function wrapperDraft(e: ExerciseEntry, picked: Picked, newId: () => string): WorkoutDraft {
  const name = "grip" in e.source ? e.name : picked.exercise;
  return withItemsAdded({ ...newWorkoutDraft(e.kind), name }, [picked], newId);
}

type ExerciseWorkoutArgs = {
  workouts: readonly LibraryWorkout[];
  /** Makes a built-in the user's own first; null when that failed. */
  pick: (source: PickerEntry["source"]) => Promise<Picked | null>;
  save: (id: string, workout: WorkoutDraft) => Promise<void>;
  newId: () => string;
  /** Entries being made right now; another ask for one of them is dropped. */
  making: Set<string>;
};

/**
 * The workout an exercise goes in a block or on a day as: its wrapper, made the first time.
 * Null when making its exercise failed, or while the same exercise's workout is still being
 * made and saved, so a second quick tap cannot make a second wrapper.
 */
export const exerciseWorkout =
  ({ workouts, pick, save, newId, making }: ExerciseWorkoutArgs) =>
  async (e: ExerciseEntry): Promise<string | null> => {
    const there = wrapperOf(workouts, e);
    if (there !== undefined) return there.id;
    const key = `${e.kind}:${itemName(e)}`;
    if (making.has(key)) return null;
    making.add(key);
    const release = (): void => void making.delete(key);
    const picked = await pick(e.source).catch((error: unknown) => {
      release();
      throw error;
    });
    if (picked === null) {
      release();
      return null;
    }
    const id = newId();
    void save(id, wrapperDraft(e, picked, newId)).then(release, release);
    return id;
  };

/** `exerciseWorkout` for a screen, remembering what it is making across renders. */
export function useExerciseWorkout(
  args: Omit<ExerciseWorkoutArgs, "making">
): (e: ExerciseEntry) => Promise<string | null> {
  const [making] = React.useState(() => new Set<string>());
  return exerciseWorkout({ ...args, making });
}
