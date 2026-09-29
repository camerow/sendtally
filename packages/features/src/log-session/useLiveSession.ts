import React from "react";
import { writeStoredDraft, type DraftStorage, type LiveDraftMeta } from "./draftStore";
import type { Gym } from "../gyms/types";
import { isLive, liveDraft, liveStoredDraft, withGymAdopted } from "./liveSession";
import type { LiveSync } from "./liveSync";
import type { ClimbDraft, LogSessionDraft } from "./types";
import { useStoredDraft, type StoredDraftEntry } from "./useDraftAutosave";

export type LiveSession = StoredDraftEntry & {
  /** Replaces the climb with its key, or appends it, starting the session at it when there is none. */
  putClimb: (climb: ClimbDraft, gyms: readonly Gym[]) => void;
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
 * with a `sync`, follow on to the server. A draft the server already has stops being live once
 * it goes quiet on another day, and is dropped from the file; one it does not have stays live
 * until it lands.
 */
export function useLiveSession(storage: DraftStorage, sync?: LiveSync): LiveSession {
  const { stored, discard } = useStoredDraft(storage);
  const live = stored !== null && isLive(stored, new Date());

  React.useEffect(() => {
    if (stored !== null && !live) discard();
  }, [stored, live, discard]);

  React.useEffect(() => {
    if (liveStoredDraft(storage, new Date()) !== null) sync?.changed();
  }, [storage, sync]);

  const current = React.useCallback(() => liveStoredDraft(storage, new Date()), [storage]);

  const write = React.useCallback(
    (draft: LogSessionDraft, meta: LiveDraftMeta | undefined): void => {
      writeStoredDraft(storage, draft, new Date(), meta);
      sync?.changed();
    },
    [storage, sync]
  );

  const putClimb = React.useCallback(
    (climb: ClimbDraft, gyms: readonly Gym[]): void => {
      const entry = current();
      const draft = entry?.draft ?? liveDraft(new Date());
      const climbs = draft.climbs.some((c) => c.key === climb.key)
        ? draft.climbs.map((c) => (c.key === climb.key ? climb : c))
        : [...draft.climbs, climb];
      write(withGymAdopted({ ...draft, climbs }, gyms), entry ?? undefined);
    },
    [current, write]
  );

  const updateClimb = React.useCallback(
    (key: string, patch: (climb: ClimbDraft) => ClimbDraft, gyms: readonly Gym[] = []): void => {
      const entry = current();
      if (entry === null) return;
      const climbs = entry.draft.climbs.map((c) => (c.key === key ? patch(c) : c));
      write(withGymAdopted({ ...entry.draft, climbs }, gyms), entry);
    },
    [current, write]
  );

  const removeClimb = React.useCallback(
    (key: string): void => {
      const entry = current();
      if (entry === null) return;
      const climbs = entry.draft.climbs.filter((c) => c.key !== key);
      if (climbs.length > 0) {
        write({ ...entry.draft, climbs }, entry);
        return;
      }
      if (entry.fingerprint !== undefined) sync?.remove(entry.fingerprint);
      discard();
    },
    [current, write, discard, sync]
  );

  return { stored: live ? stored : null, discard, putClimb, updateClimb, removeClimb };
}
