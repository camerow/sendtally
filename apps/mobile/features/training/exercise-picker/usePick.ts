import { pickedOf, type PickerSource } from "@sendtally/features/exercises";
export { pickedOf } from "@sendtally/features/exercises";
import { useMakeExercise } from "../exercises/useMakeExercise";
import type { Picked } from "@sendtally/features/workouts";

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
