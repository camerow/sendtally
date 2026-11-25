import type { SendtallyApi } from "@sendtally/api-client";
import { queries, useQuery } from "../query";
import { madeCounts } from "../training/locks";
import { useWorkoutLibrary } from "../workouts/useWorkoutLibrary";
import { membersGet, type MembersGet } from "./benefits";

export function useMembersGet(api: SendtallyApi): MembersGet | null {
  const entitlements = useQuery(queries.entitlements(api)).state;
  const hang = useQuery(queries.hang(api)).state;
  const plan = useQuery(queries.plan(api)).state;
  const exercises = useQuery(queries.exercises(api)).state;
  const library = useWorkoutLibrary(api).state;
  if (entitlements.status !== "ready" || hang.status !== "ready") return null;
  const made =
    plan.status === "ready" && exercises.status === "ready" && library.status === "ready"
      ? madeCounts({
          workouts: library.data.workouts,
          blocks: plan.data.blocks,
          exercises: exercises.data,
          grips: hang.data.grips,
        })
      : null;
  return membersGet(entitlements.data, made, hang.data.settings.units);
}
