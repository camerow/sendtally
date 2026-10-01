import { router } from "expo-router";

export function startWorkout(workoutId: string, gripId: string): void {
  router.push({ pathname: "/timer", params: { workoutId, gripId } });
}
