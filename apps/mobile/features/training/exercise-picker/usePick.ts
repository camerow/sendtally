import { pickWith, type PickerSource } from "@sendtally/features/exercises";
import type { Picked } from "@sendtally/features/workouts";
import { useMakeExercise } from "../exercises/useMakeExercise";

export { pickedOf } from "@sendtally/features/exercises";

/** What a picker row adds to a workout (see `pickWith`). */
export function usePick(): (source: PickerSource) => Promise<Picked | null> {
  return pickWith(useMakeExercise());
}
