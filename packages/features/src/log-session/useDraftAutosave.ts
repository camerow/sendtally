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
  /** The form adopting the user's saved grade scale - a settling, not something they typed. */
  rebase: (draft: LogSessionDraft) => void;
  resume: () => void;
  startFresh: () => void;
  /** Write whatever is pending now - the app is about to leave the foreground. */
  flush: () => void;
  /** Drop the stored draft and stop saving - the session made it to the server. */
  clear: () => void;
};

/**
 * `storage` is null where autosave does not apply - only a new session is worth rescuing.
 * Adopting the user's saved grade scale is not an edit, so the form announces it with `rebase`
 * rather than saving holding off until preferences arrive: a preference request that never
 * settles used to swallow everything typed while it hung.
 *
 * A pending write is flushed when the form unmounts, so leaving right after an edit keeps it.
 * Editing while an older draft is on offer overwrites that draft: the user saw the offer and
 * typed anyway, and what they are typing now is the session worth keeping.
 *
 * `autoResume` is the form opened by tapping the draft itself: the form starts on that draft
 * (see `storedDraft`), so there is nothing to offer - the user already chose it.
 */
export function useDraftAutosave(
  storage: DraftStorage | null,
  draft: LogSessionDraft,
  onResume: (draft: LogSessionDraft) => void,
  autoResume = false
): DraftAutosave {
  const [dismissed, setDismissed] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState<Date | null>(
    () =>
      (autoResume ? parseStoredDraft(storage?.read() ?? null, new Date()) : null)?.savedAt ?? null
  );
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
  const offered = dismissed || saved || autoResume || stored === null ? null : stored;

  React.useEffect(() => {
    saver?.update(draft);
  }, [draft, saver]);

  const rebase = React.useCallback((next: LogSessionDraft) => saver?.rebase(next), [saver]);

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

  const flush = React.useCallback(() => saver?.flush(), [saver]);

  const clear = React.useCallback(() => {
    saver?.stop();
    storage?.remove();
    setSavedAt(null);
  }, [saver, storage]);

  return { offered, savedAt, rebase, resume, startFresh, flush, clear };
}

export type StoredDraftEntry = { stored: StoredSessionDraft | null; discard: () => void };

/** Read-only view of the stored draft, for surfacing it outside the form. */
export function useStoredDraft(storage: DraftStorage): StoredDraftEntry {
  const stored = useParsedDraft(useStoredRaw(storage));
  const discard = React.useCallback(() => storage.remove(), [storage]);
  return { stored, discard };
}
