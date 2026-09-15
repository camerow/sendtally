import { writeStoredDraft, type DraftStorage } from "./draftStore";
import type { LogSessionDraft } from "./types";

export type DraftAutosaver = {
  /** Schedule a write if the draft differs from the last known one; edits within the debounce coalesce. */
  update: (draft: LogSessionDraft) => void;
  /** Write whatever is pending right now - the form is going away. */
  flush: () => void;
  /** Take the draft as the new baseline without writing it. */
  reset: (draft: LogSessionDraft) => void;
  /**
   * The form settling into the user's preferences, which is not an edit - unless they have
   * already edited, in which case it rides along with what they typed.
   */
  rebase: (draft: LogSessionDraft) => void;
  /** No more writes: the session reached the server. */
  stop: () => void;
};

export function createDraftAutosaver(
  storage: DraftStorage,
  debounceMs: number,
  onSaved: (at: Date) => void
): DraftAutosaver {
  let baseline: string | null = null;
  let pending: LogSessionDraft | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;
  let wrote = false;

  const cancel = (): void => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };

  const flush = (): void => {
    cancel();
    if (pending === null || stopped) return;
    const draft = pending;
    pending = null;
    baseline = JSON.stringify(draft);
    wrote = true;
    const at = writeStoredDraft(storage, draft, new Date());
    if (at !== null) onSaved(at);
  };

  const update = (draft: LogSessionDraft): void => {
    if (stopped) return;
    const serialized = JSON.stringify(draft);
    if (serialized === baseline) {
      pending = null;
      cancel();
      return;
    }
    pending = draft;
    cancel();
    timer = setTimeout(flush, debounceMs);
  };

  return {
    update,
    flush,
    reset: (draft) => {
      cancel();
      pending = null;
      baseline = JSON.stringify(draft);
    },
    rebase: (draft) => {
      if (stopped) return;
      if (pending !== null) {
        pending = draft;
        return;
      }
      if (wrote) {
        update(draft);
        return;
      }
      baseline = JSON.stringify(draft);
    },
    stop: () => {
      stopped = true;
      cancel();
      pending = null;
    },
  };
}
