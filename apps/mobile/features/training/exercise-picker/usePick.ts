import type { PickerSource } from "@sendtally/features/exercises";
import type { MadeExercise } from "../exercises/types";
import { useMakeExercise } from "../exercises/useMakeExercise";
import type { Picked } from "./types";

/** A grip, or one of the user's exercises, as a workout item names it. */
export const pickedOf = (made: MadeExercise): Picked =>
  "grip" in made
    ? { exercise: made.grip.id }
    : { exercise: made.exercise.name, measure: made.exercise.measure };

/**
 * What a picker row adds to a workout. A built-in becomes the user's own exercise first,
 * linked to it so its name stays translated; null when that save failed.
 */
export function usePick(): (source: PickerSource) => Promise<Picked | null> {
  const make = useMakeExercise();
  return async (source) => {
    if (!("builtIn" in source)) return pickedOf(source);
    const { id, name, kind, measure } = source.builtIn;
    const made = await make({ kind, name, measure, eachSide: false }, id);
    return made === null ? null : pickedOf(made);
  };
}
