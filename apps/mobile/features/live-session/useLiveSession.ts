import React from "react";
import {
  storedDraft,
  useStoredDraft,
  withClimbTouched,
  withQuickClimb,
  writeStoredDraft,
  type ClimbDraft,
  type GradePrefs,
  type LogSessionDraft,
  type StoredSessionDraft,
} from "@sendtally/features/log-session";
import { sessionDraftStorage } from "../../lib/sessionDraftStorage";

export type LiveSession = {
  stored: StoredSessionDraft | null;
  /** Appends a climb, starting the session at it when there is none, and returns its key. */
  addClimb: (prefs: GradePrefs) => string;
  updateClimb: (key: string, patch: (climb: ClimbDraft) => ClimbDraft) => void;
  /** Removing the last climb removes the session with it. */
  removeClimb: (key: string) => void;
  discard: () => void;
};

const write = (draft: LogSessionDraft): void => {
  writeStoredDraft(sessionDraftStorage, draft, new Date());
};

/** The device-local draft, edited one climb at a time from the Log tab. Writes land at once. */
export function useLiveSession(): LiveSession {
  const { stored, discard } = useStoredDraft(sessionDraftStorage);

  const addClimb = React.useCallback((prefs: GradePrefs): string => {
    const next = withQuickClimb(storedDraft(sessionDraftStorage), new Date(), prefs);
    write(next.draft);
    return next.key;
  }, []);

  const updateClimb = React.useCallback(
    (key: string, patch: (climb: ClimbDraft) => ClimbDraft): void => {
      const draft = storedDraft(sessionDraftStorage);
      if (draft === null) return;
      write(
        withClimbTouched(
          { ...draft, climbs: draft.climbs.map((c) => (c.key === key ? patch(c) : c)) },
          new Date()
        )
      );
    },
    []
  );

  const removeClimb = React.useCallback(
    (key: string): void => {
      const draft = storedDraft(sessionDraftStorage);
      if (draft === null) return;
      const climbs = draft.climbs.filter((c) => c.key !== key);
      if (climbs.length === 0) discard();
      else write({ ...draft, climbs });
    },
    [discard]
  );

  return { stored, addClimb, updateClimb, removeClimb, discard };
}
