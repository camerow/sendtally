import React from "react";
import {
  parseStoredDraft,
  writeStoredDraft,
  type DraftStorage,
  type StoredSessionDraft,
} from "./draftStore";
import type { LogSessionDraft } from "./types";

const DEBOUNCE_MS = 400;

const noStorage = (): string | null => null;
const noSubscription = (): (() => void) => () => {};

function useStoredRaw(storage: DraftStorage | null): string | null {
  return React.useSyncExternalStore(
    storage?.subscribe ?? noSubscription,
    storage?.read ?? noStorage,
    noStorage
  );
}

function useParsedDraft(raw: string | null): StoredSessionDraft | null {
  return React.useMemo(() => parseStoredDraft(raw, new Date()), [raw]);
}

export type DraftAutosave = {
  /** A draft from a previous visit, waiting on resume or start-fresh. */
  offered: StoredSessionDraft | null;
  savedAt: Date | null;
  resume: () => void;
  startFresh: () => void;
  /** Drop the stored draft and stop saving - the session made it to the server. */
  clear: () => void;
};

/**
 * `storage` is null where autosave does not apply - only a new session is worth rescuing.
 * `ready` holds saving off while the form is still settling into the user's preferences,
 * so adopting a saved grade scale is not mistaken for the first thing they typed.
 */
export function useDraftAutosave(
  storage: DraftStorage | null,
  draft: LogSessionDraft,
  onResume: (draft: LogSessionDraft) => void,
  ready = true
): DraftAutosave {
  const [mountedAt] = React.useState(() => Date.now());
  const [dismissed, setDismissed] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState<Date | null>(null);
  const baseline = React.useRef(JSON.stringify(draft));
  const done = React.useRef(false);

  const stored = useParsedDraft(useStoredRaw(storage));
  /** Anything saved since this form opened is our own autosave, never an offer to resume. */
  const offered =
    dismissed || stored === null || stored.savedAt.getTime() >= mountedAt ? null : stored;

  React.useEffect(() => {
    if (!ready) {
      baseline.current = JSON.stringify(draft);
      return;
    }
    if (storage === null || offered !== null || done.current) return;
    const serialized = JSON.stringify(draft);
    if (serialized === baseline.current) return;
    const timer = setTimeout(() => {
      setSavedAt(writeStoredDraft(storage, draft, new Date()));
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draft, offered, ready, storage]);

  const resume = React.useCallback(() => {
    if (offered === null) return;
    baseline.current = JSON.stringify(offered.draft);
    onResume(offered.draft);
    setSavedAt(offered.savedAt);
    setDismissed(true);
  }, [offered, onResume]);

  const startFresh = React.useCallback(() => {
    storage?.remove();
    setDismissed(true);
  }, [storage]);

  const clear = React.useCallback(() => {
    done.current = true;
    storage?.remove();
    setSavedAt(null);
  }, [storage]);

  return { offered, savedAt, resume, startFresh, clear };
}

export type StoredDraftEntry = { stored: StoredSessionDraft | null; discard: () => void };

/** Read-only view of the stored draft, for surfacing it outside the form. */
export function useStoredDraft(storage: DraftStorage): StoredDraftEntry {
  const stored = useParsedDraft(useStoredRaw(storage));
  const discard = React.useCallback(() => storage.remove(), [storage]);
  return { stored, discard };
}
