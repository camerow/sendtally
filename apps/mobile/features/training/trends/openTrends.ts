import { router } from "expo-router";

/** Hangboard trends on one workout and grip. */
export function openTrends(workoutId: string, gripId: string, replace = false): void {
  const href = { pathname: "/workout/trends", params: { workout: workoutId, grip: gripId } };
  if (replace) router.replace(href);
  else router.push(href);
}
