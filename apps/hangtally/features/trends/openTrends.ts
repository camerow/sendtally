import { router } from "expo-router";

/** Trends on one workout and grip. */
export function openTrends(workoutId: string, gripId: string): void {
  router.navigate({ pathname: "/trends", params: { workout: workoutId, grip: gripId } });
}
