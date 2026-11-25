import type { Exercise } from "@sendtally/api-client";
import { exerciseNameKey, wrapsBuiltIn, type Grip, type Membership } from "@sendtally/core/hang";
import type { PickerSource } from "../exercises/types";
import type { QueryState } from "../query";
import type { LibrarySource } from "../workouts/types";

/** Where a locked press was, as the Membership page reads it. */
export type LockSource = "workout" | "exercise" | "block" | "create" | "plan_day";

/** A workout as the lock reads it: whose it is and what it holds. */
export type LockWorkout = { source: LibrarySource; items: readonly { exercise: string }[] };

/** The user's exercises, by which a one-item workout's exercise is told built-in or their own. */
export type LockExercises = readonly Pick<Exercise, "name" | "builtIn">[];

/** A workout the user made: theirs, and not the one-item workout a scheduled built-in becomes. */
const ownWorkout = (w: LockWorkout, exercises: LockExercises): boolean =>
  w.source === "mine" &&
  !wrapsBuiltIn(w.items, (name) => {
    const key = exerciseNameKey(name);
    return (exercises.find((e) => exerciseNameKey(e.name) === key)?.builtIn ?? null) !== null;
  });

/** An exercise or grip the user made: not picked from the built-ins, not a built-in grip. */
const ownExercise = (source: PickerSource): boolean =>
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

/** Nothing is locked while access is unknown, and no workout reads as the user's own until their exercises load. */
export const locks = (access: boolean | null, exercises: QueryState<LockExercises>): Locks => {
  const shut = access === false;
  const own = (w: LockWorkout): boolean =>
    exercises.status === "ready" && ownWorkout(w, exercises.data);
  return {
    workout: (w) => shut && own(w),
    exercise: (source) => shut && ownExercise(source),
    day: (m, w) => shut && (m.blockId !== null || own(w)),
    block: shut,
    create: shut,
  };
};

/** Whether the lock covers a planned day, its workout looked up in the library; open until the library has it. */
export const dayLocked =
  (locks: Locks, workout: (id: string) => LockWorkout | undefined) =>
  (m: Pick<Membership, "blockId" | "workoutId">): boolean => {
    const w = workout(m.workoutId);
    return w !== undefined && locks.day(m, w);
  };
