import { router } from "expo-router";
import type { PickerSource } from "@sendtally/features/exercises";

/** An exercise's page: a grip's, the user's own, or a built-in's. */
export function openExercise(source: PickerSource): void {
  if ("grip" in source) router.push({ pathname: "/grip/[id]", params: { id: source.grip.id } });
  else
    router.push({
      pathname: "/exercise/[id]",
      params: { id: "exercise" in source ? source.exercise.id : source.builtIn.id },
    });
}
