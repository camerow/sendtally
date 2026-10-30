import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import { useActivities } from "../activities/useActivities";
import { queries, useQuery, type QueryState } from "../query";
import { usePlan } from "../training/usePlan";
import { libraryOf, workoutUsage } from "./library";
import type { LibraryWorkout, WorkoutUse } from "./types";
import { useWorkouts } from "./useWorkouts";

export type WorkoutLibrary = {
  workouts: LibraryWorkout[];
  usage: ReadonlyMap<string, WorkoutUse>;
  workout: (id: string) => LibraryWorkout | undefined;
};

export type WorkoutLibraryQuery = {
  state: QueryState<WorkoutLibrary>;
  reload: () => Promise<void>;
};

const ready = <T>(state: QueryState<T>, empty: T): T =>
  state.status === "ready" ? state.data : empty;

/** The one library, ready once the user's own workouts are; usage fills in as the log loads. */
export function useWorkoutLibrary(api: SendtallyApi): WorkoutLibraryQuery {
  const { state: mine, reload } = useWorkouts(api);
  const { state: activities } = useActivities(api);
  const { state: hang } = useQuery(queries.hang(api));
  const { state: plan } = usePlan(api);
  const state = React.useMemo((): QueryState<WorkoutLibrary> => {
    if (mine.status !== "ready") return mine;
    const workouts = libraryOf(mine.data);
    const byId = new Map(workouts.map((w) => [w.id, w]));
    // ponytail: climbing sessions count only through what they are linked to here; add the
    // session log when a climbing workout's use needs counting.
    const usage = workoutUsage(
      [...(hang.status === "ready" ? hang.data.sessions : []), ...ready(activities, [])],
      plan.status === "ready" ? plan.data.memberships : []
    );
    return { status: "ready", data: { workouts, usage, workout: (id) => byId.get(id) } };
  }, [mine, activities, hang, plan]);
  return { state, reload };
}
