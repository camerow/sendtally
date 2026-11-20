import type { Context } from "hono";
import { type AppEnv, captureEvent } from "./context";
import { exerciseNameKey } from "./lib/exercises";
import type { BlockInput, MembershipInput, WorkoutInput } from "./lib/plan";
import * as repo from "./lib/repo";

/** A value event: something the user made, marked as onboarding while the wizard or a path runs. */
export async function captureValueEvent(
  c: Context<AppEnv>,
  event: string,
  properties: Record<string, string | number | boolean>
): Promise<void> {
  const user = await repo.getUser(c.env.DB, c.get("userId"));
  await captureEvent(c, event, { ...properties, onboarding: repo.inOnboarding(user) });
}

export async function captureWorkoutCreated(
  c: Context<AppEnv>,
  workout: Pick<WorkoutInput, "kind" | "items">
): Promise<void> {
  const own = await repo.listExercises(c.env.DB, c.get("userId"));
  const builtIn = new Set(own.filter((e) => e.built_in !== null).map((e) => e.name_key));
  const items = workout.items;
  await captureValueEvent(c, "workout_created", {
    kind: workout.kind,
    exercise_count: items.length,
    from_library: items.filter((i) => builtIn.has(exerciseNameKey(i.exercise))).length,
    superset_count: new Set(items.flatMap((i) => (i.group === undefined ? [] : [i.group.id]))).size,
    alternating_count: items.filter((i) => i.doses.length > 1).length,
    rest_set: items.some((i) => i.doses.some((d) => d.setRestS !== undefined)),
  });
}

export const captureBlockCreated = (c: Context<AppEnv>, block: BlockInput): Promise<void> =>
  captureValueEvent(c, "block_created", { weeks: block.weeks });

export const captureBlockScheduled = (
  c: Context<AppEnv>,
  membership: Pick<MembershipInput, "weekdays">
): Promise<void> =>
  captureValueEvent(c, "block_scheduled", { weekday_count: membership.weekdays.length });
