import { router } from "expo-router";
import React from "react";
import { statsSegmentStorage } from "../../lib/statsSegmentStorage";
import type { StatsSegment } from "./types";

const read = (): StatsSegment =>
  statsSegmentStorage.read() === "training" ? "training" : "climbing";

/** The segment last shown on this device, Climbing until one has been picked. */
export function useStatsSegment(): [StatsSegment, (segment: StatsSegment) => void] {
  const segment = React.useSyncExternalStore(statsSegmentStorage.subscribe, read);
  return [segment, (next) => void statsSegmentStorage.write(next)];
}

/** The Stats tab on a segment, closing the screens above the tabs. */
export function openStats(segment: StatsSegment): void {
  statsSegmentStorage.write(segment);
  router.dismissTo("/(tabs)/stats");
}
