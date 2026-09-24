import React from "react";
import { writeStoredDraft, type DraftStorage } from "./draftStore";
import type { Gym } from "../gyms/types";
import type { ClimbKind } from "./climbKind";
import {
  liveStoredDraft,
  localDate,
  withClimbTouched,
  withGymAdopted,
  withQuickClimb,
} from "./liveSession";
import type { LiveSync } from "./liveSync";
import type { ClimbDraft, GradePrefs, LogSessionDraft } from "./types";
import { useStoredDraft, type StoredDraftEntry } from "./useDraftAutosave";

export type LiveSession = StoredDraftEntry & {
  /** Appends a climb, starting the session at it when there is none, and returns its key. */
  addClimb: (prefs: GradePrefs, gyms: readonly Gym[], kind: ClimbKind) => string;
  /** Pass the gyms when the patch can put the climb on a circuit, so the session adopts its gym. */
  updateClimb: (
    key: string,
    patch: (climb: ClimbDraft) => ClimbDraft,
    gyms?: readonly Gym[]
  ) => void;
  /** Removing the last climb removes the session with it. */
  removeClimb: (key: string) => void;
};

/**
 * The device-local draft, edited one climb at a time from the log. Writes land at once and,
 * with a `sync`, follow on to the server. Only today's draft is live: an older one the server
 * already has is dropped from the file, and an older one it does not have is left for the
 * form to offer.
 */
export function useLiveSession(storage: DraftStorage, sync?: LiveSync): LiveSession {
  const { stored, discard } = useStoredDraft(storage);
  const today = stored !== null && stored.draft.date === localDate(new Date());
  const synced = stored?.fingerprint !== undefined;

  React.useEffect(() => {
    if (stored !== null && !today && synced) discard();
  }, [stored, today, synced, discard]);

  const current = React.useCallback(() => liveStoredDraft(storage, new Date()), [storage]);

  const write = React.useCallback(
    (draft: LogSessionDraft, fingerprint: string | undefined): void => {
      writeStoredDraft(storage, draft, new Date(), fingerprint);
      sync?.changed();
    },
    [storage, sync]
  );

  const addClimb = React.useCallback(
    (prefs: GradePrefs, gyms: readonly Gym[], kind: ClimbKind): string => {
      const entry = current();
      const next = withQuickClimb(entry?.draft ?? null, new Date(), prefs, gyms, kind);
      write(next.draft, entry?.fingerprint);
      return next.key;
    },
    [current, write]
  );

  const updateClimb = React.useCallback(
    (key: string, patch: (climb: ClimbDraft) => ClimbDraft, gyms: readonly Gym[] = []): void => {
      const entry = current();
      if (entry === null) return;
      const climbs = entry.draft.climbs.map((c) => (c.key === key ? patch(c) : c));
      const draft = withClimbTouched(withGymAdopted({ ...entry.draft, climbs }, gyms), new Date());
      write(draft, entry.fingerprint);
    },
    [current, write]
  );

  const removeClimb = React.useCallback(
    (key: string): void => {
      const entry = current();
      if (entry === null) return;
      const climbs = entry.draft.climbs.filter((c) => c.key !== key);
      if (climbs.length > 0) {
        write({ ...entry.draft, climbs }, entry.fingerprint);
        return;
      }
      if (entry.fingerprint !== undefined) sync?.remove(entry.fingerprint);
      discard();
    },
    [current, write, discard, sync]
  );

  return { stored: today ? stored : null, discard, addClimb, updateClimb, removeClimb };
}
