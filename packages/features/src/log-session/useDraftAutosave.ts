import React from "react";
import { createDraftAutosaver, type DraftAutosaver as Autosaver } from "./draftAutosaver";
import { parseStoredDraft, type DraftStorage, type StoredSessionDraft } from "./draftStore";
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
 *
 * A pending write is flushed when the form unmounts, so leaving right after an edit keeps it.
 * Editing while an older draft is on offer overwrites that draft: the user saw the offer and
 * typed anyway, and what they are typing now is the session worth keeping.
 */
export function useDraftAutosave(
  storage: DraftStorage | null,
  draft: LogSessionDraft,
  onResume: (draft: LogSessionDraft) => void,
  ready = true
): DraftAutosave {
  const [dismissed, setDismissed] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState<Date | null>(null);
  /** Whether this form has autosaved yet - what makes a stored draft ours rather than an offer. */
  const [saved, setSaved] = React.useState(false);
  const [saver] = React.useState<Autosaver | null>(() => {
    if (storage === null) return null;
    const created = createDraftAutosaver(storage, DEBOUNCE_MS, (at) => {
      setSavedAt(at);
      setSaved(true);
    });
    created.reset(draft);
    return created;
  });

  const stored = useParsedDraft(useStoredRaw(storage));
  /**
   * Our own autosave is never an offer to resume. Which writes are ours is something the
   * saver knows, so ask it: comparing the stored draft's clock time against this form's
   * mount time made it a race, and the previous form's flush lands whenever React unmounts
   * it - sometimes after the next form is already up, which silently swallowed the offer.
   */
  const offered = dismissed || saved || stored === null ? null : stored;

  React.useEffect(() => {
    if (saver === null) return;
    if (ready) saver.update(draft);
    else saver.reset(draft);
  }, [draft, ready, saver]);

  React.useEffect(() => () => saver?.flush(), [saver]);

  const resume = React.useCallback(() => {
    if (offered === null) return;
    saver?.reset(offered.draft);
    onResume(offered.draft);
    setSavedAt(offered.savedAt);
    setDismissed(true);
  }, [offered, onResume, saver]);

  const startFresh = React.useCallback(() => {
    storage?.remove();
    setDismissed(true);
  }, [storage]);

  const clear = React.useCallback(() => {
    saver?.stop();
    storage?.remove();
    setSavedAt(null);
  }, [saver, storage]);

  return { offered, savedAt, resume, startFresh, clear };
}

export type StoredDraftEntry = { stored: StoredSessionDraft | null; discard: () => void };

/** Read-only view of the stored draft, for surfacing it outside the form. */
export function useStoredDraft(storage: DraftStorage): StoredDraftEntry {
  const stored = useParsedDraft(useStoredRaw(storage));
  const discard = React.useCallback(() => storage.remove(), [storage]);
  return { stored, discard };
}
