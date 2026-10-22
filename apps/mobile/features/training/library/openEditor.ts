import { router } from "expo-router";
import type { WorkoutCategory } from "@sendtally/features/workouts";

/** A new workout's editor: the hangboard builder, or the workout editor for the category. */
export function openEditor(category: WorkoutCategory): void {
  if (category === "hang") router.push("/workout/builder");
  else router.push({ pathname: "/workout/edit", params: { category } });
}
