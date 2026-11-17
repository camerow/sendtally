import React from "react";
import type { DraftStorage } from "../log-session/draftStore";
import { WORKLOAD_WINDOWS, workloadWeeksOf, type WorkloadWeeks } from "./workloadView";

/** The Workload card's window as this device last picked it. */
export function useWorkloadWeeks(
  storage: DraftStorage
): [WorkloadWeeks, (weeks: WorkloadWeeks) => void] {
  const weeks = React.useSyncExternalStore(
    storage.subscribe,
    () => workloadWeeksOf(storage.read()),
    () => WORKLOAD_WINDOWS[0]
  );
  return [weeks, (next) => void storage.write(String(next))];
}
