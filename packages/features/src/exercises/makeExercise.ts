import { ApiError, type Exercise } from "@sendtally/api-client";
import type { Picked } from "../workouts/types";
import { doseMeasureOf } from "../workouts/doseFields";
import { builtInDose } from "./builtIns";
import type { MadeExercise } from "./types";

/** The exercise already holding a name a save asked for, from the API's 409. */
export const takenBy = (error: unknown): Exercise | undefined =>
  error instanceof ApiError && error.status === 409
    ? (error.body as { exercise?: Exercise } | null)?.exercise
    : undefined;

/** A grip, or one of the user's exercises, as a workout item names it. */
export function pickedOf(made: MadeExercise): Picked {
  if ("grip" in made)
    return {
      exercise: made.grip.id,
      ...(made.grip.measure === undefined ? {} : { measure: made.grip.measure }),
    };
  const dose = builtInDose(made.exercise.builtIn);
  return {
    exercise: made.exercise.name,
    measure: doseMeasureOf(made.exercise),
    ...(dose === undefined ? {} : { dose }),
  };
}
