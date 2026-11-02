import { router } from "expo-router";
import type { LogSegment } from "@sendtally/features/journal";
import { statsSegmentStorage } from "../../lib/statsSegmentStorage";
import { useStoredSegment } from "../../lib/storedSegment";

export function useStatsSegment(): [LogSegment, (segment: LogSegment) => void] {
  return useStoredSegment(statsSegmentStorage);
}

/** The Stats tab on a segment, closing the screens above the tabs. */
export function openStats(segment: LogSegment): void {
  statsSegmentStorage.write(segment);
  router.dismissTo("/(tabs)/stats");
}
