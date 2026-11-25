import type { Exercise } from "@sendtally/api-client";
import type { Grip, Workout } from "@sendtally/core/hang";
import type { QueryState } from "../query";
import { exerciseKey, workoutsUsing, type ExerciseSeries } from "../statistics/exercises";
import type { PickerSource } from "./types";

/** How its owner removes an exercise: a grip is archived; an exercise is removed, kept archived while a workout or log names it. */
export type ExerciseRemoval = { grip: Grip } | { exercise: Exercise; inUse: boolean };

/** What removing this exercise does; a built-in has nothing of the user's to remove. */
export function exerciseRemoval(
  source: PickerSource,
  library: QueryState<{ workouts: readonly Pick<Workout, "kind" | "items">[] }>,
  series: QueryState<readonly Pick<ExerciseSeries, "key">[]>
): ExerciseRemoval | undefined {
  if ("grip" in source) return { grip: source.grip };
  if (!("exercise" in source)) return undefined;
  const { name } = source.exercise;
  const inUse =
    (library.status === "ready" && workoutsUsing(library.data.workouts, name).length > 0) ||
    (series.status === "ready" && series.data.some((s) => s.key === exerciseKey(name)));
  return { exercise: source.exercise, inUse };
}
