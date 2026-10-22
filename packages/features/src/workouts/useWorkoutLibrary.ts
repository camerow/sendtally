import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import { useActivities, usePlanItems } from "../activities";
import type { HangModel } from "../hang";
import type { QueryState } from "../query";
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

/** The one library, ready once the user's own workouts are; usage fills in as the log loads. */
export function useWorkoutLibrary(api: SendtallyApi, hang: HangModel): WorkoutLibraryQuery {
  const { state: mine, reload } = useWorkouts(api);
  const { state: activities } = useActivities(api);
  const { state: plan } = usePlanItems(api);
  const state = React.useMemo((): QueryState<WorkoutLibrary> => {
    if (mine.status !== "ready") return mine;
    const workouts = libraryOf(hang.workouts, mine.data);
    const byId = new Map(workouts.map((w) => [w.id, w]));
    const usage = workoutUsage(
      hang.sessions,
      activities.status === "ready" ? activities.data : [],
      plan.status === "ready" ? plan.data : []
    );
    return { status: "ready", data: { workouts, usage, workout: (id) => byId.get(id) } };
  }, [mine, activities, plan, hang]);
  return { state, reload };
}
