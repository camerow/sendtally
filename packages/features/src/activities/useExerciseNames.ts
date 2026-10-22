import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import { exerciseNames } from "./detail";
import { useActivities } from "./useActivities";

/** Exercise names from the user's own logged sets, newest first, for autocomplete. */
export function useExerciseNames(api: SendtallyApi): string[] {
  const { state } = useActivities(api);
  const activities = state.status === "ready" ? state.data : null;
  return React.useMemo(() => (activities === null ? [] : exerciseNames(activities)), [activities]);
}
