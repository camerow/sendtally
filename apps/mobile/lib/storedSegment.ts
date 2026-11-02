import React from "react";
import type { LogSegment } from "@sendtally/features/journal";
import type { DraftStorage } from "@sendtally/features/log-session";

/** The half last shown on this device, Climbing until one has been picked. */
export function useStoredSegment(storage: DraftStorage): [LogSegment, (next: LogSegment) => void] {
  const segment = React.useSyncExternalStore(storage.subscribe, () =>
    storage.read() === "training" ? "training" : "climbing"
  );
  return [segment, (next) => void storage.write(next)];
}

/** A link's `segment` param, remembered as the half to open on. */
export function useSegmentParam(storage: DraftStorage, segment: string | undefined): void {
  React.useEffect(() => {
    if (segment === "climbing" || segment === "training") storage.write(segment);
  }, [storage, segment]);
}
