import type { Exercise } from "@sendtally/api-client";
import { exerciseNameKey, isBuiltInGrip, type Grip, type Membership } from "@sendtally/core/hang";
import type { PickerSource } from "../exercises/types";
import type { LibrarySource } from "../workouts/types";

/** Where a locked press was, as the Membership page reads it. */
export type LockSource = "workout" | "exercise" | "block" | "create" | "plan_day";

/** A workout as the lock reads it: whose it is and what it holds. */
export type LockWorkout = { source: LibrarySource; items: readonly { exercise: string }[] };

/** The user's exercises, by which a one-item workout's exercise is told built-in or their own. */
export type LockExercises = readonly Pick<Exercise, "name" | "builtIn">[];

/** One item of a built-in grip, or of an exercise picked from the built-ins: how Schedule on a built-in plans it. */
const wrapsBuiltIn = (items: LockWorkout["items"], exercises: LockExercises): boolean => {
  const [only] = items;
  if (only === undefined || items.length > 1) return false;
  if (isBuiltInGrip(only.exercise)) return true;
  const key = exerciseNameKey(only.exercise);
  return (exercises.find((e) => exerciseNameKey(e.name) === key)?.builtIn ?? null) !== null;
};

/** A workout the user made: theirs, and not the one-item workout a scheduled built-in becomes. */
export const ownWorkout = (w: LockWorkout, exercises: LockExercises): boolean =>
  w.source === "mine" && !wrapsBuiltIn(w.items, exercises);

/** An exercise or grip the user made: not picked from the built-ins, not a built-in grip. */
export const ownExercise = (source: PickerSource): boolean =>
  "exercise" in source ? source.exercise.builtIn === null : "grip" in source && source.grip.custom;

export type MadeCounts = { workouts: number; blocks: number; exercises: number };

/** What the user made and still has: their workouts, every block and template, their exercises and grips. */
export const madeCounts = (made: {
  workouts: readonly LockWorkout[];
  blocks: readonly unknown[];
  exercises: readonly Exercise[];
  grips: readonly Grip[];
}): MadeCounts => ({
  workouts: made.workouts.filter((w) => ownWorkout(w, made.exercises)).length,
  blocks: made.blocks.length,
  exercises:
    made.exercises.filter((exercise) => !exercise.archived && ownExercise({ exercise })).length +
    made.grips.filter((grip) => !grip.hidden && ownExercise({ grip })).length,
});

/** What a press opens the Membership page for instead; with access nothing is locked. */
export type Locks = {
  workout: (w: LockWorkout) => boolean;
  exercise: (source: PickerSource) => boolean;
  /** A planned day in a block, or one that uses a workout the user made. */
  day: (m: Pick<Membership, "blockId">, w: LockWorkout) => boolean;
  /** Every block and template, the block in progress among them. */
  block: boolean;
  /** Every way to make something: Create, a shelf's plus, Duplicate, Add to workout and Add to block. */
  create: boolean;
};

export const locks = (access: boolean, exercises: LockExercises): Locks => ({
  workout: (w) => !access && ownWorkout(w, exercises),
  exercise: (source) => !access && ownExercise(source),
  day: (m, w) => !access && (m.blockId !== null || ownWorkout(w, exercises)),
  block: !access,
  create: !access,
});
