import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import { useClimbs, workoutClimbSessions } from "@sendtally/features/climbs";
import { historyCard, type HistoryCardVM, useDisplayScales } from "@sendtally/features/settings";

/** The card from the whole log, as Stats reads it; refetched after every save, so it grows with each climb. */
export function useHistoryCard(api: SendtallyApi): HistoryCardVM | null {
  const { state } = useClimbs(api);
  const scales = useDisplayScales();
  return React.useMemo(() => {
    if (state.status !== "ready") return null;
    const { sessions, activities, climbs } = state.data;
    return historyCard([...sessions, ...workoutClimbSessions(activities)], climbs, scales);
  }, [state, scales]);
}
