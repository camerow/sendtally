import React from "react";
import { storedDraft, writeStoredDraft, type DraftStorage } from "./draftStore";
import type { Gym } from "../gyms/types";
import type { ClimbKind } from "./climbKind";
import { withClimbTouched, withQuickClimb } from "./liveSession";
import type { ClimbDraft, GradePrefs, LogSessionDraft } from "./types";
import { useStoredDraft, type StoredDraftEntry } from "./useDraftAutosave";

export type LiveSession = StoredDraftEntry & {
  /** Appends a climb, starting the session at it when there is none, and returns its key. */
  addClimb: (prefs: GradePrefs, gyms: readonly Gym[], kind: ClimbKind) => string;
  updateClimb: (key: string, patch: (climb: ClimbDraft) => ClimbDraft) => void;
  /** Removing the last climb removes the session with it. */
  removeClimb: (key: string) => void;
};

/** The device-local draft, edited one climb at a time from the log. Writes land at once. */
export function useLiveSession(storage: DraftStorage): LiveSession {
  const { stored, discard } = useStoredDraft(storage);
  const write = React.useCallback(
    (draft: LogSessionDraft): void => {
      writeStoredDraft(storage, draft, new Date());
    },
    [storage]
  );

  const addClimb = React.useCallback(
    (prefs: GradePrefs, gyms: readonly Gym[], kind: ClimbKind): string => {
      const next = withQuickClimb(storedDraft(storage), new Date(), prefs, gyms, kind);
      write(next.draft);
      return next.key;
    },
    [storage, write]
  );

  const updateClimb = React.useCallback(
    (key: string, patch: (climb: ClimbDraft) => ClimbDraft): void => {
      const draft = storedDraft(storage);
      if (draft === null) return;
      write(
        withClimbTouched(
          { ...draft, climbs: draft.climbs.map((c) => (c.key === key ? patch(c) : c)) },
          new Date()
        )
      );
    },
    [storage, write]
  );

  const removeClimb = React.useCallback(
    (key: string): void => {
      const draft = storedDraft(storage);
      if (draft === null) return;
      const climbs = draft.climbs.filter((c) => c.key !== key);
      if (climbs.length === 0) discard();
      else write({ ...draft, climbs });
    },
    [storage, write, discard]
  );

  return { stored, discard, addClimb, updateClimb, removeClimb };
}
