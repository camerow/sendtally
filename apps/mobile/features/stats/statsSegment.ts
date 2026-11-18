import { router } from "expo-router";
import React from "react";
import { statsSegmentStorage } from "../../lib/statsSegmentStorage";

export type StatsSegment = "climbing" | "training";

/** The half last shown on this device, Climbing until one has been picked. */
export function useStatsSegment(): [StatsSegment, (segment: StatsSegment) => void] {
  const segment = React.useSyncExternalStore(statsSegmentStorage.subscribe, () =>
    statsSegmentStorage.read() === "training" ? "training" : "climbing"
  );
  return [segment, (next) => void statsSegmentStorage.write(next)];
}

/** A link's `segment` param, remembered as the half to open on. */
export function useStatsSegmentParam(segment: string | undefined): void {
  React.useEffect(() => {
    if (segment === "climbing" || segment === "training") statsSegmentStorage.write(segment);
  }, [segment]);
}

/** The Stats tab on a segment, closing the screens above the tabs. */
export function openStats(segment: StatsSegment): void {
  statsSegmentStorage.write(segment);
  router.dismissTo("/(tabs)/stats");
}
